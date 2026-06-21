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
  return `bill-${billId}`;
}

export function buildProcessingWhatsAppMetadata(existingMetadata, { queueJobId }) {
  const now = new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.PROCESSING,
    delivery_requested: true,
    delivery_requested_at: existingMetadata.delivery_requested_at || now,
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

export function buildFailedWhatsAppMetadata(existingMetadata, error) {
  const now = new Date().toISOString();

  return {
    ...existingMetadata,
    status: WHATSAPP_DELIVERY_STATUS.FAILED,
    completed_at: now,
    error_message: error?.message || "WhatsApp delivery failed",
    provider_message_id: null,
  };
}
