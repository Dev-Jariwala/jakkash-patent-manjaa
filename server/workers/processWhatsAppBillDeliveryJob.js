import { fetchBillForDelivery } from "../services/billForDelivery.js";
import { buildBillPdfFilename, generateBillPdfBuffer } from "../services/billPdfGeneration.js";
import {
  buildCanceledWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildProviderAcceptedWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  evaluateWhatsAppDeliveryJobState,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";
import {
  persistWhatsAppDeliveryCancellation,
  persistWhatsAppDeliveryOutcome,
  WORKER_CANCEL_OVERWRITABLE_STATUSES,
} from "../services/whatsappBillDeliveryPersistence.js";
import { parseWhatsAppMetadata } from "../services/whatsappBillDeliveryErrors.js";
import {
  normalizeDeliveryError,
  sendBillDocumentOnWhatsApp,
} from "../services/whatsappProvider.js";

export class WhatsAppDeliveryPersistenceAfterSendError extends Error {
  constructor(providerMessageId, originalError) {
    super(
      `WhatsApp provider accepted send (${providerMessageId}) but local metadata persistence failed`
    );
    this.name = "WhatsAppDeliveryPersistenceAfterSendError";
    this.code = "WHATSAPP_DELIVERY_PERSISTENCE_FAILED_AFTER_SEND";
    this.providerMessageId = providerMessageId;
    this.cause = originalError;
  }
}

async function loadDeliveryContext({ billId, collectionId }) {
  const bill = await fetchBillForDelivery({ billId, collectionId });
  const metadata = parseWhatsAppMetadata(bill.whatsapp_metadata);
  return { bill, metadata };
}

async function persistDeliveryFailure({ billId, collectionId, existingMetadata, error, jobId }) {
  const failedMetadata = buildFailedWhatsAppMetadata(existingMetadata, error);
  return persistWhatsAppDeliveryOutcome({
    billId,
    collectionId,
    metadata: failedMetadata,
    jobId,
  });
}

/**
 * Confirms the cancel this job is stopping for. Guarded on the job id so a
 * resend issued right after the cancel is not overwritten by this job's
 * finalization, which would strand the new attempt as a stale job.
 */
async function persistDeliveryCanceled({ billId, collectionId, existingMetadata, jobId }) {
  const canceledMetadata = buildCanceledWhatsAppMetadata(existingMetadata);
  return persistWhatsAppDeliveryCancellation({
    billId,
    collectionId,
    metadata: canceledMetadata,
    jobId,
    allowedStatuses: WORKER_CANCEL_OVERWRITABLE_STATUSES,
  });
}

async function resolveDeliveryJobState({ billId, collectionId, jobId }) {
  const { bill, metadata } = await loadDeliveryContext({ billId, collectionId });
  const evaluation = evaluateWhatsAppDeliveryJobState(metadata, jobId);

  if (evaluation.action === "abort") {
    const error = new Error("Bill is missing WhatsApp delivery metadata");
    error.code = "WHATSAPP_METADATA_MISSING";
    throw error;
  }

  if (evaluation.action === "skip") {
    console.warn(
      `[whatsapp-delivery-worker] Skipping job ${jobId} for bill ${billId}: ${evaluation.reason} (status "${evaluation.status}")`
    );
    return {
      outcome: "skipped",
      bill,
      metadata,
      status: evaluation.status,
    };
  }

  if (evaluation.action === "canceled") {
    const cancelWrite = await persistDeliveryCanceled({
      billId,
      collectionId,
      existingMetadata: metadata,
      jobId,
    });
    console.warn(
      `[whatsapp-delivery-worker] Cancel detected for bill ${billId}; delivery stopped`
    );
    return {
      outcome: "canceled",
      bill,
      metadata: cancelWrite.bill?.whatsapp_metadata || metadata,
      status: WHATSAPP_DELIVERY_STATUS.CANCELED,
    };
  }

  return {
    outcome: "continue",
    bill,
    metadata,
  };
}

export async function processWhatsAppBillDeliveryJob(job) {
  const { billId, collectionId } = job.data;
  const jobId = job.id;

  console.log(
    `[whatsapp-delivery-worker] Processing queue job ${jobId} for bill ${billId} (collection ${collectionId})`
  );

  let initialState;
  try {
    initialState = await resolveDeliveryJobState({ billId, collectionId, jobId });
  } catch (error) {
    console.error(
      `[whatsapp-delivery-worker] Failed to load bill ${billId} for delivery:`,
      error
    );
    throw error;
  }

  if (initialState.outcome === "skipped") {
    return {
      billId,
      collectionId,
      skipped: true,
      status: initialState.status,
    };
  }

  if (initialState.outcome === "canceled") {
    return {
      billId,
      collectionId,
      canceled: true,
      status: initialState.status,
    };
  }

  let bill = initialState.bill;
  let currentMetadata = initialState.metadata;
  let pdfBuffer = null;
  let providerMessageId = null;

  try {
    pdfBuffer = await generateBillPdfBuffer(bill);

    const afterPdfState = await resolveDeliveryJobState({ billId, collectionId, jobId });
    if (afterPdfState.outcome === "skipped") {
      return {
        billId,
        collectionId,
        skipped: true,
        status: afterPdfState.status,
      };
    }
    if (afterPdfState.outcome === "canceled") {
      return {
        billId,
        collectionId,
        canceled: true,
        status: afterPdfState.status,
      };
    }
    bill = afterPdfState.bill;
    currentMetadata = afterPdfState.metadata;

    const filename = buildBillPdfFilename(bill);
    ({ providerMessageId } = await sendBillDocumentOnWhatsApp({
      pdfBuffer,
      filename,
      bill,
    }));

    const beforePersistState = await resolveDeliveryJobState({ billId, collectionId, jobId });
    if (beforePersistState.outcome === "skipped") {
      return {
        billId,
        collectionId,
        skipped: true,
        status: beforePersistState.status,
      };
    }
    if (beforePersistState.outcome === "canceled") {
      return {
        billId,
        collectionId,
        canceled: true,
        status: beforePersistState.status,
      };
    }
    currentMetadata = beforePersistState.metadata;

    const providerAcceptedMetadata = buildProviderAcceptedWhatsAppMetadata(currentMetadata, {
      providerMessageId,
    });
    const providerAcceptance = await persistWhatsAppDeliveryOutcome({
      billId,
      collectionId,
      metadata: providerAcceptedMetadata,
      jobId,
    });

    if (!providerAcceptance.persisted) {
      // A cancel landed after the provider already accepted the send. The bill
      // keeps its `canceled` state; the delivered copy is noted for reconciliation.
      console.warn(
        `[whatsapp-delivery-worker] Bill ${billId} was canceled after the provider accepted message ${providerMessageId}; keeping canceled state`
      );
      return {
        billId,
        collectionId,
        canceled: true,
        status: WHATSAPP_DELIVERY_STATUS.CANCELED,
        providerMessageId,
      };
    }

    currentMetadata =
      providerAcceptance.bill.whatsapp_metadata || providerAcceptedMetadata;

    const beforeSuccessState = await resolveDeliveryJobState({ billId, collectionId, jobId });
    if (beforeSuccessState.outcome === "skipped") {
      return {
        billId,
        collectionId,
        skipped: true,
        status: beforeSuccessState.status,
      };
    }
    if (beforeSuccessState.outcome === "canceled") {
      return {
        billId,
        collectionId,
        canceled: true,
        status: beforeSuccessState.status,
      };
    }
    currentMetadata = beforeSuccessState.metadata;

    const successMetadata = buildSuccessWhatsAppMetadata(currentMetadata, {
      providerMessageId,
    });
    const successWrite = await persistWhatsAppDeliveryOutcome({
      billId,
      collectionId,
      metadata: successMetadata,
      jobId,
    });

    if (!successWrite.persisted) {
      // Last line of defence against a late success overwriting a cancel that
      // landed between the checkpoint above and this write (PRD 43).
      console.warn(
        `[whatsapp-delivery-worker] Bill ${billId} was canceled before success could be recorded (provider message ${providerMessageId}); keeping canceled state`
      );
      return {
        billId,
        collectionId,
        canceled: true,
        status: WHATSAPP_DELIVERY_STATUS.CANCELED,
        providerMessageId,
      };
    }

    console.log(
      `[whatsapp-delivery-worker] Bill ${billId} delivered successfully (provider message ${providerMessageId})`
    );

    return {
      billId,
      collectionId,
      status:
        successWrite.bill.whatsapp_metadata?.status || WHATSAPP_DELIVERY_STATUS.SUCCESS,
      providerMessageId,
    };
  } catch (error) {
    if (providerMessageId) {
      console.error(
        `[whatsapp-delivery-worker] Provider accepted send for bill ${billId} (message ${providerMessageId}) but local persistence failed:`,
        error
      );
      throw new WhatsAppDeliveryPersistenceAfterSendError(providerMessageId, error);
    }

    const deliveryError = normalizeDeliveryError(error);
    console.error(
      `[whatsapp-delivery-worker] Delivery failed for bill ${billId}:`,
      deliveryError.message
    );

    try {
      const latestState = await loadDeliveryContext({ billId, collectionId });
      const latestEvaluation = evaluateWhatsAppDeliveryJobState(latestState.metadata, jobId);

      if (latestEvaluation.action === "canceled") {
        await persistDeliveryCanceled({
          billId,
          collectionId,
          existingMetadata: latestState.metadata,
          jobId,
        });
        console.warn(
          `[whatsapp-delivery-worker] Delivery failed for bill ${billId} but cancel was requested; persisted canceled`
        );
        return {
          billId,
          collectionId,
          canceled: true,
          status: WHATSAPP_DELIVERY_STATUS.CANCELED,
        };
      }

      if (latestEvaluation.action === "skip") {
        console.warn(
          `[whatsapp-delivery-worker] Delivery failed for bill ${billId} but job is no longer active; skipping failure write`
        );
        return {
          billId,
          collectionId,
          skipped: true,
          status: latestEvaluation.status,
        };
      }

      const failureWrite = await persistDeliveryFailure({
        billId,
        collectionId,
        existingMetadata: latestState.metadata,
        error: deliveryError,
        jobId,
      });

      if (failureWrite.persisted) {
        console.error(
          `[whatsapp-delivery-worker] Delivery failed for bill ${billId}; failure metadata persisted`
        );
      } else {
        console.warn(
          `[whatsapp-delivery-worker] Delivery failed for bill ${billId} but a cancel or newer attempt won the write; failure not recorded`
        );
      }
    } catch (persistError) {
      console.error(
        `[whatsapp-delivery-worker] Delivery failed for bill ${billId} and failure metadata could not be persisted:`,
        deliveryError.message,
        persistError
      );
      throw persistError;
    }

    throw deliveryError;
  } finally {
    // Intentionally discard generated PDF bytes; they must not be persisted.
    pdfBuffer = null;
  }
}
