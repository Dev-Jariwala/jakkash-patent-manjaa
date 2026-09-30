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

/**
 * Everything this job reaches outside itself, in one place.
 *
 * The delivery orchestration — when to re-check cancel state, which write wins,
 * what a lost race returns — is the behaviour the PRD calls the highest test
 * seam, and it is untestable while the DB and the provider are baked in.
 * Production always uses these defaults; tests substitute them.
 */
export const defaultDeliveryDependencies = {
  fetchBillForDelivery,
  generateBillPdfBuffer,
  buildBillPdfFilename,
  sendBillDocumentOnWhatsApp,
  persistWhatsAppDeliveryOutcome,
  persistWhatsAppDeliveryCancellation,
  logger: console,
};

async function loadDeliveryContext({ billId, collectionId }, deps) {
  const bill = await deps.fetchBillForDelivery({ billId, collectionId });
  const metadata = parseWhatsAppMetadata(bill.whatsapp_metadata);
  return { bill, metadata };
}

async function persistDeliveryFailure(
  { billId, collectionId, existingMetadata, error, jobId },
  deps
) {
  const failedMetadata = buildFailedWhatsAppMetadata(existingMetadata, error);
  return deps.persistWhatsAppDeliveryOutcome({
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
async function persistDeliveryCanceled(
  { billId, collectionId, existingMetadata, jobId },
  deps
) {
  const canceledMetadata = buildCanceledWhatsAppMetadata(existingMetadata);
  return deps.persistWhatsAppDeliveryCancellation({
    billId,
    collectionId,
    metadata: canceledMetadata,
    jobId,
    allowedStatuses: WORKER_CANCEL_OVERWRITABLE_STATUSES,
  });
}

/**
 * The cancellation checkpoint the worker runs between every major step
 * (PRD 41, ADR 0006). Re-reads the bill rather than trusting the copy this job
 * started with, because the operator's cancel lands in the database, not here.
 */
async function resolveDeliveryJobState({ billId, collectionId, jobId }, deps) {
  const { bill, metadata } = await loadDeliveryContext({ billId, collectionId }, deps);
  const evaluation = evaluateWhatsAppDeliveryJobState(metadata, jobId);

  if (evaluation.action === "abort") {
    const error = new Error("Bill is missing WhatsApp delivery metadata");
    error.code = "WHATSAPP_METADATA_MISSING";
    throw error;
  }

  if (evaluation.action === "skip") {
    deps.logger.warn(
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
    const cancelWrite = await persistDeliveryCanceled(
      { billId, collectionId, existingMetadata: metadata, jobId },
      deps
    );
    deps.logger.warn(
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

/**
 * Turns a checkpoint that did not say "continue" into the job's return value,
 * or `null` to carry on. Keeps the four checkpoints in the send path reading as
 * checkpoints instead of four copies of the same branch.
 */
function stopResultFor(state, { billId, collectionId }) {
  if (state.outcome === "skipped") {
    return { billId, collectionId, skipped: true, status: state.status };
  }

  if (state.outcome === "canceled") {
    return { billId, collectionId, canceled: true, status: state.status };
  }

  return null;
}

export async function processWhatsAppBillDeliveryJob(job, dependencies) {
  // BullMQ calls the processor as `(job, token)` with a string token, so only a
  // real dependency object is allowed to override the defaults.
  const overrides =
    dependencies && typeof dependencies === "object" ? dependencies : {};
  const deps = { ...defaultDeliveryDependencies, ...overrides };
  const { billId, collectionId } = job.data;
  const jobId = job.id;

  deps.logger.log(
    `[whatsapp-delivery-worker] Processing queue job ${jobId} for bill ${billId} (collection ${collectionId})`
  );

  const checkpoint = () => resolveDeliveryJobState({ billId, collectionId, jobId }, deps);

  let initialState;
  try {
    initialState = await checkpoint();
  } catch (error) {
    deps.logger.error(
      `[whatsapp-delivery-worker] Failed to load bill ${billId} for delivery:`,
      error
    );
    throw error;
  }

  const initialStop = stopResultFor(initialState, { billId, collectionId });
  if (initialStop) {
    return initialStop;
  }

  let bill = initialState.bill;
  let currentMetadata = initialState.metadata;
  let pdfBuffer = null;
  let providerMessageId = null;

  try {
    pdfBuffer = await deps.generateBillPdfBuffer(bill);

    const afterPdfState = await checkpoint();
    const afterPdfStop = stopResultFor(afterPdfState, { billId, collectionId });
    if (afterPdfStop) {
      return afterPdfStop;
    }
    bill = afterPdfState.bill;
    currentMetadata = afterPdfState.metadata;

    const filename = deps.buildBillPdfFilename(bill);
    ({ providerMessageId } = await deps.sendBillDocumentOnWhatsApp({
      pdfBuffer,
      filename,
      bill,
    }));

    const beforePersistState = await checkpoint();
    const beforePersistStop = stopResultFor(beforePersistState, { billId, collectionId });
    if (beforePersistStop) {
      return beforePersistStop;
    }
    currentMetadata = beforePersistState.metadata;

    const providerAcceptedMetadata = buildProviderAcceptedWhatsAppMetadata(currentMetadata, {
      providerMessageId,
    });
    const providerAcceptance = await deps.persistWhatsAppDeliveryOutcome({
      billId,
      collectionId,
      metadata: providerAcceptedMetadata,
      jobId,
    });

    if (!providerAcceptance.persisted) {
      // A cancel landed after the provider already accepted the send. The bill
      // keeps its `canceled` state; the delivered copy is noted for reconciliation.
      deps.logger.warn(
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

    const beforeSuccessState = await checkpoint();
    const beforeSuccessStop = stopResultFor(beforeSuccessState, { billId, collectionId });
    if (beforeSuccessStop) {
      return beforeSuccessStop;
    }
    currentMetadata = beforeSuccessState.metadata;

    const successMetadata = buildSuccessWhatsAppMetadata(currentMetadata, {
      providerMessageId,
    });
    const successWrite = await deps.persistWhatsAppDeliveryOutcome({
      billId,
      collectionId,
      metadata: successMetadata,
      jobId,
    });

    if (!successWrite.persisted) {
      // Last line of defence against a late success overwriting a cancel that
      // landed between the checkpoint above and this write (PRD 43).
      deps.logger.warn(
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

    deps.logger.log(
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
      deps.logger.error(
        `[whatsapp-delivery-worker] Provider accepted send for bill ${billId} (message ${providerMessageId}) but local persistence failed:`,
        error
      );
      throw new WhatsAppDeliveryPersistenceAfterSendError(providerMessageId, error);
    }

    const deliveryError = normalizeDeliveryError(error);
    deps.logger.error(
      `[whatsapp-delivery-worker] Delivery failed for bill ${billId}:`,
      deliveryError.message
    );

    try {
      const latestState = await loadDeliveryContext({ billId, collectionId }, deps);
      const latestEvaluation = evaluateWhatsAppDeliveryJobState(latestState.metadata, jobId);

      if (latestEvaluation.action === "canceled") {
        await persistDeliveryCanceled(
          { billId, collectionId, existingMetadata: latestState.metadata, jobId },
          deps
        );
        deps.logger.warn(
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
        deps.logger.warn(
          `[whatsapp-delivery-worker] Delivery failed for bill ${billId} but job is no longer active; skipping failure write`
        );
        return {
          billId,
          collectionId,
          skipped: true,
          status: latestEvaluation.status,
        };
      }

      const failureWrite = await persistDeliveryFailure(
        {
          billId,
          collectionId,
          existingMetadata: latestState.metadata,
          error: deliveryError,
          jobId,
        },
        deps
      );

      if (failureWrite.persisted) {
        deps.logger.error(
          `[whatsapp-delivery-worker] Delivery failed for bill ${billId}; failure metadata persisted`
        );
      } else {
        deps.logger.warn(
          `[whatsapp-delivery-worker] Delivery failed for bill ${billId} but a cancel or newer attempt won the write; failure not recorded`
        );
      }
    } catch (persistError) {
      deps.logger.error(
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
