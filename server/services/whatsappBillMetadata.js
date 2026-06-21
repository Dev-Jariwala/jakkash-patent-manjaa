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
