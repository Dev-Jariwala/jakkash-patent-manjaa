import { query } from "../utils/query.js";
import { removeWhatsAppBillDeliveryJob } from "../queues/whatsappBillDeliveryQueue.js";
import {
  BillNotFoundError,
  parseWhatsAppMetadata,
} from "./whatsappBillDeliveryErrors.js";
import {
  buildCanceledWhatsAppMetadata,
  createInitialWhatsAppMetadata,
  evaluateWhatsAppCancelEligibility,
} from "./whatsappBillMetadata.js";
import {
  OPERATOR_CANCEL_OVERWRITABLE_STATUSES,
  persistWhatsAppDeliveryCancellation,
} from "./whatsappBillDeliveryPersistence.js";

export class WhatsAppCancelNotAllowedError extends Error {
  constructor({ message, reason, status }) {
    super(message);
    this.name = "WhatsAppCancelNotAllowedError";
    this.code = "WHATSAPP_CANCEL_NOT_ALLOWED";
    this.statusCode = 409;
    this.reason = reason;
    this.deliveryStatus = status;
  }
}

/**
 * Explains a cancel that was refused by the guarded write, using the state the
 * bill actually landed in so the operator sees the real outcome instead of a
 * bare conflict.
 */
async function buildLostCancelRaceError({ billId, collectionId }) {
  const [bill] = await query(
    "SELECT whatsapp_metadata FROM bills WHERE bill_id = $1 AND collection_id = $2",
    [billId, collectionId]
  );

  if (!bill) {
    return new BillNotFoundError();
  }

  const settledMetadata =
    parseWhatsAppMetadata(bill.whatsapp_metadata) || createInitialWhatsAppMetadata();
  const settledEligibility = evaluateWhatsAppCancelEligibility(settledMetadata);

  if (!settledEligibility.allowed) {
    return new WhatsAppCancelNotAllowedError(settledEligibility);
  }

  // Still processing but under a different job: a newer attempt took over.
  return new WhatsAppCancelNotAllowedError({
    status: settledEligibility.status,
    reason: "delivery_changed",
    message:
      "This bill's WhatsApp delivery changed while the cancel was being applied. Refresh and try again.",
  });
}

/**
 * Force cancel an in-flight WhatsApp bill delivery (ADR 0005, ADR 0006).
 *
 * Deliberately *not* gated on the WhatsApp service toggle: turning the service
 * off is exactly when an operator most needs to unstick a bill, and gating cancel
 * would strand it in `processing` with editing blocked and resend refused.
 *
 * Order matters. The `canceled` state is persisted before the queue job is
 * touched because `whatsapp_metadata` is the source of truth the worker reads
 * between steps. Writing it first means:
 *  - an active worker sees the cancel at its next checkpoint and aborts;
 *  - a Redis outage still leaves the bill canceled and editable;
 *  - a job that survives removal is a no-op, because the worker re-reads the
 *    bill and finds it canceled before sending.
 */
export async function forceCancelBillWhatsAppDelivery({ billId, collectionId }) {
  const [bill] = await query(
    "SELECT * FROM bills WHERE bill_id = $1 AND collection_id = $2",
    [billId, collectionId]
  );

  if (!bill) {
    throw new BillNotFoundError();
  }

  const metadata =
    parseWhatsAppMetadata(bill.whatsapp_metadata) || createInitialWhatsAppMetadata();

  const eligibility = evaluateWhatsAppCancelEligibility(metadata);
  if (!eligibility.allowed) {
    throw new WhatsAppCancelNotAllowedError(eligibility);
  }

  // Guarded write: the worker can finish between the read above and this update,
  // and a delivery that genuinely reached the client must keep its `success`
  // rather than being relabelled as the operator's cancel.
  const cancelWrite = await persistWhatsAppDeliveryCancellation({
    billId,
    collectionId,
    metadata: buildCanceledWhatsAppMetadata(metadata),
    jobId: metadata.queue_job_id,
    allowedStatuses: OPERATOR_CANCEL_OVERWRITABLE_STATUSES,
  });

  if (!cancelWrite.persisted) {
    throw await buildLostCancelRaceError({ billId, collectionId });
  }

  const canceledBill = cancelWrite.bill;

  const jobRemoval = await removeWhatsAppBillDeliveryJob(metadata.queue_job_id);

  if (jobRemoval.error) {
    // The bill is already canceled, so a stale queue entry cannot deliver it.
    console.error(
      `[whatsapp-delivery-cancel] Bill ${billId} canceled but queue job ${metadata.queue_job_id} could not be inspected:`,
      jobRemoval.error
    );
  }

  // A job that was found but not removed is already running; the worker stops it
  // on a best-effort basis rather than the queue dropping it outright.
  const workerAbortPending = jobRemoval.found && !jobRemoval.removed;

  console.warn(
    `[whatsapp-delivery-cancel] Bill ${billId} force-canceled (job ${metadata.queue_job_id || "none"}, state "${jobRemoval.state || "unknown"}", removed: ${jobRemoval.removed})`
  );

  return {
    bill: canceledBill,
    jobRemoved: jobRemoval.removed,
    jobState: jobRemoval.state,
    workerAbortPending,
  };
}
