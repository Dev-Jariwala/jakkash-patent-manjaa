import { randomUUID } from "crypto";

export const WHATSAPP_DELIVERY_STATUS = {
  NO: "no",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELED: "canceled",
};

export function createInitialWhatsAppMetadata({ deliveryRequested = false } = {}) {
  return {
    status: WHATSAPP_DELIVERY_STATUS.NO,
    delivery_requested: deliveryRequested,
    delivery_requested_at: deliveryRequested ? new Date().toISOString() : null,
    processing_started_at: null,
    completed_at: null,
    error_message: null,
    provider_message_id: null,
    provider_accepted_at: null,
    queue_job_id: null,
    cancel_requested: false,
    canceled_at: null,
  };
}

export function resolveCreateBillWhatsAppMetadata({
  serviceEnabled,
  sendBillOnWhatsApp,
}) {
  const deliveryRequested = Boolean(serviceEnabled && sendBillOnWhatsApp);
  return createInitialWhatsAppMetadata({ deliveryRequested });
}

export function buildBillDeliveryJobId(billId) {
  return `bill-${billId}-${randomUUID()}`;
}

/**
 * Statuses a bill can be resent from. Only `processing` is excluded, so a bill
 * never has more than one delivery attempt in flight at a time.
 */
export const RESENDABLE_WHATSAPP_DELIVERY_STATUSES = [
  WHATSAPP_DELIVERY_STATUS.NO,
  WHATSAPP_DELIVERY_STATUS.SUCCESS,
  WHATSAPP_DELIVERY_STATUS.FAILED,
  WHATSAPP_DELIVERY_STATUS.CANCELED,
];

export function evaluateWhatsAppResendEligibility(metadata) {
  const status = metadata?.status || WHATSAPP_DELIVERY_STATUS.NO;

  if (status === WHATSAPP_DELIVERY_STATUS.PROCESSING) {
    return {
      allowed: false,
      status,
      reason: "delivery_in_progress",
      message:
        "This bill already has a WhatsApp delivery in progress. Force cancel it before resending.",
    };
  }

  if (!RESENDABLE_WHATSAPP_DELIVERY_STATUSES.includes(status)) {
    return {
      allowed: false,
      status,
      reason: "unsupported_status",
      message: `WhatsApp delivery cannot be resent from status "${status}".`,
    };
  }

  return { allowed: true, status };
}

export function evaluateWhatsAppDeliveryJobState(metadata, jobId) {
  if (!metadata) {
    return { action: "abort", reason: "metadata_missing" };
  }

  if (metadata.queue_job_id !== jobId) {
    return {
      action: "skip",
      reason: "stale_job",
      status: metadata.status,
    };
  }

  if (
    metadata.cancel_requested ||
    metadata.status === WHATSAPP_DELIVERY_STATUS.CANCELED
  ) {
    return { action: "canceled" };
  }

  if (metadata.status !== WHATSAPP_DELIVERY_STATUS.PROCESSING) {
    return {
      action: "skip",
      reason: "not_processing",
      status: metadata.status,
    };
  }

  return { action: "continue" };
}

/**
 * @param {object} existingMetadata
 * @param {object} options
 * @param {string} options.queueJobId
 * @param {boolean} [options.resetRequestedAt] Resend starts a brand new request,
 *   so the audit timestamp should reflect the latest ask rather than the original.
 */
export function buildProcessingWhatsAppMetadata(
  existingMetadata,
  { queueJobId, resetRequestedAt = false }
) {
  const now = new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.PROCESSING,
    delivery_requested: true,
    delivery_requested_at: resetRequestedAt
      ? now
      : existingMetadata.delivery_requested_at || now,
    processing_started_at: now,
    queue_job_id: queueJobId,
    completed_at: null,
    error_message: null,
    provider_message_id: null,
    provider_accepted_at: null,
    cancel_requested: false,
    canceled_at: null,
  };
}

export function buildEnqueueFailedWhatsAppMetadata(existingMetadata, error) {
  const now = new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.FAILED,
    delivery_requested: true,
    processing_started_at: null,
    queue_job_id: null,
    completed_at: now,
    error_message: error?.message || "Failed to enqueue WhatsApp delivery job",
    provider_message_id: null,
    provider_accepted_at: null,
    cancel_requested: false,
    canceled_at: null,
  };
}

export function buildProviderAcceptedWhatsAppMetadata(existingMetadata, { providerMessageId }) {
  const now = new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.PROCESSING,
    provider_message_id: providerMessageId,
    provider_accepted_at: now,
    error_message: null,
  };
}

export function buildSuccessWhatsAppMetadata(existingMetadata, { providerMessageId }) {
  const now = new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.SUCCESS,
    completed_at: now,
    error_message: null,
    provider_message_id: providerMessageId,
    provider_accepted_at: existingMetadata.provider_accepted_at || now,
    cancel_requested: false,
    canceled_at: null,
  };
}

export function buildCanceledWhatsAppMetadata(existingMetadata, { canceledAt } = {}) {
  const now = canceledAt || new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.CANCELED,
    completed_at: now,
    cancel_requested: true,
    canceled_at: existingMetadata.canceled_at || now,
    error_message: null,
  };
}

export function buildFailedWhatsAppMetadata(existingMetadata, error) {
  const now = new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.FAILED,
    completed_at: now,
    error_message: error?.message || "WhatsApp delivery failed",
    provider_message_id: existingMetadata.provider_message_id ?? null,
    provider_accepted_at: existingMetadata.provider_accepted_at ?? null,
  };
}
