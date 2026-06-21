import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis.js";

export const WHATSAPP_BILL_DELIVERY_QUEUE_NAME = "whatsapp-bill-delivery";

let queueInstance = null;

export function getWhatsAppBillDeliveryQueue() {
  if (!queueInstance) {
    queueInstance = new Queue(WHATSAPP_BILL_DELIVERY_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 1,
      },
    });
  }
  return queueInstance;
}

export async function enqueueWhatsAppBillDelivery({ billId, collectionId, jobId }) {
  const queue = getWhatsAppBillDeliveryQueue();
  return queue.add(
    "deliver-bill",
    { billId, collectionId },
    { jobId }
  );
}
