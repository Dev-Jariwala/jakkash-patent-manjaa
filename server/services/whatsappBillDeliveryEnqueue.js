import { query } from "../utils/query.js";
import { enqueueWhatsAppBillDelivery } from "../queues/whatsappBillDeliveryQueue.js";
import {
  buildBillDeliveryJobId,
  buildEnqueueFailedWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
} from "./whatsappBillMetadata.js";

export class EnqueueWhatsAppDeliveryError extends Error {
  constructor(originalError, bill) {
    super(originalError?.message || "Failed to enqueue WhatsApp delivery");
    this.name = "EnqueueWhatsAppDeliveryError";
    this.cause = originalError;
    this.bill = bill;
  }
}

async function persistWhatsAppMetadata({ billId, collectionId, metadata }) {
  const [updatedBill] = await query(
    `UPDATE bills
     SET whatsapp_metadata = $1::jsonb
     WHERE bill_id = $2 AND collection_id = $3
     RETURNING *`,
    [JSON.stringify(metadata), billId, collectionId]
  );

  if (!updatedBill) {
    throw new Error("Failed to persist WhatsApp delivery metadata");
  }

  return updatedBill;
}

export async function enqueueBillWhatsAppDelivery({ billId, collectionId, whatsappMetadata }) {
  const queueJobId = buildBillDeliveryJobId(billId);
  const processingMetadata = buildProcessingWhatsAppMetadata(whatsappMetadata, { queueJobId });

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
    const job = await enqueueWhatsAppBillDelivery({ billId, collectionId, jobId: queueJobId });
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
