import { enqueueWhatsAppBillDelivery } from "../queues/whatsappBillDeliveryQueue.js";
import {
  buildBillDeliveryJobId,
  buildEnqueueFailedWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
} from "./whatsappBillMetadata.js";
import { persistWhatsAppMetadata } from "./whatsappBillDeliveryPersistence.js";

/** Test-only stand-in for BullMQ `queue.add` so createOrder can be exercised without Redis. */
let deliverBillJobAddForTests = null;

export function __setWhatsAppBillDeliveryJobAddForTests(override) {
  deliverBillJobAddForTests = override;
}

export class EnqueueWhatsAppDeliveryError extends Error {
  constructor(originalError, bill) {
    super(originalError?.message || "Failed to enqueue WhatsApp delivery");
    this.name = "EnqueueWhatsAppDeliveryError";
    this.cause = originalError;
    this.bill = bill;
  }
}

export async function enqueueBillWhatsAppDelivery({
  billId,
  collectionId,
  whatsappMetadata,
  resetRequestedAt = false,
}) {
  const queueJobId = buildBillDeliveryJobId(billId);
  const processingMetadata = buildProcessingWhatsAppMetadata(whatsappMetadata, {
    queueJobId,
    resetRequestedAt,
  });

  let billWithProcessingState;
  try {
    billWithProcessingState = await persistWhatsAppMetadata({
      billId,
      collectionId,
      metadata: processingMetadata,
    });
  } catch (persistError) {
    const failedMetadata = buildEnqueueFailedWhatsAppMetadata(whatsappMetadata, persistError);
    const failedBill = await persistWhatsAppMetadata({
      billId,
      collectionId,
      metadata: failedMetadata,
    }).catch(() => null);
    throw new EnqueueWhatsAppDeliveryError(persistError, failedBill);
  }

  try {
    const job = deliverBillJobAddForTests
      ? await deliverBillJobAddForTests({ billId, collectionId, jobId: queueJobId })
      : await enqueueWhatsAppBillDelivery({ billId, collectionId, jobId: queueJobId });
    return { job, bill: billWithProcessingState };
  } catch (enqueueError) {
    const failedMetadata = buildEnqueueFailedWhatsAppMetadata(
      billWithProcessingState.whatsapp_metadata,
      enqueueError
    );
    const failedBill = await persistWhatsAppMetadata({
      billId,
      collectionId,
      metadata: failedMetadata,
    }).catch(() => billWithProcessingState);
    throw new EnqueueWhatsAppDeliveryError(enqueueError, failedBill);
  }
}
