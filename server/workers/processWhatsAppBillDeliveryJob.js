/**
 * Phase 4 stub: picks up delivery jobs from Redis without sending WhatsApp.
 * Phase 5 will add PDF generation, provider send, and outcome persistence.
 */
export async function processWhatsAppBillDeliveryJob(job) {
  const { billId, collectionId } = job.data;

  console.log(
    `[whatsapp-delivery-worker] Picked up queue job ${job.id} for bill ${billId} (collection ${collectionId}) — stub handler only, WhatsApp not sent`
  );

  // Intentionally no-op until Phase 5 implements the real send pipeline.
  return { billId, collectionId, phase: "stub", whatsapp_sent: false };
}
