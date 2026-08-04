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
import { persistWhatsAppMetadata } from "../services/whatsappBillDeliveryPersistence.js";
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

function parseWhatsAppMetadata(rawMetadata) {
  if (!rawMetadata) {
    return null;
  }

  if (typeof rawMetadata === "string") {
    try {
      return JSON.parse(rawMetadata);
    } catch {
      return null;
    }
  }

  return rawMetadata;
}

async function loadDeliveryContext({ billId, collectionId }) {
  const bill = await fetchBillForDelivery({ billId, collectionId });
  const metadata = parseWhatsAppMetadata(bill.whatsapp_metadata);
  return { bill, metadata };
}

async function persistDeliveryFailure({ billId, collectionId, existingMetadata, error }) {
  const failedMetadata = buildFailedWhatsAppMetadata(existingMetadata, error);
  return persistWhatsAppMetadata({
    billId,
    collectionId,
    metadata: failedMetadata,
  });
}

async function persistDeliveryCanceled({ billId, collectionId, existingMetadata }) {
  const canceledMetadata = buildCanceledWhatsAppMetadata(existingMetadata);
  return persistWhatsAppMetadata({
    billId,
    collectionId,
    metadata: canceledMetadata,
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
    const updatedBill = await persistDeliveryCanceled({
      billId,
      collectionId,
      existingMetadata: metadata,
    });
    console.warn(
      `[whatsapp-delivery-worker] Cancel detected for bill ${billId}; delivery stopped`
    );
    return {
      outcome: "canceled",
      bill,
      metadata: updatedBill.whatsapp_metadata || metadata,
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
    const billWithProviderAcceptance = await persistWhatsAppMetadata({
      billId,
      collectionId,
      metadata: providerAcceptedMetadata,
    });
    currentMetadata = billWithProviderAcceptance.whatsapp_metadata || providerAcceptedMetadata;

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
    const updatedBill = await persistWhatsAppMetadata({
      billId,
      collectionId,
      metadata: successMetadata,
    });

    console.log(
      `[whatsapp-delivery-worker] Bill ${billId} delivered successfully (provider message ${providerMessageId})`
    );

    return {
      billId,
      collectionId,
      status: updatedBill.whatsapp_metadata?.status || WHATSAPP_DELIVERY_STATUS.SUCCESS,
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

      await persistDeliveryFailure({
        billId,
        collectionId,
        existingMetadata: latestState.metadata,
        error: deliveryError,
      });
      console.error(
        `[whatsapp-delivery-worker] Delivery failed for bill ${billId}; failure metadata persisted`
      );
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
