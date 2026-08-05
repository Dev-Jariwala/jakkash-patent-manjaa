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

/**
 * Job states a force-cancel can delete outright. An `active` job is already
 * running, so BullMQ refuses to remove it and cancellation falls back to the
 * metadata flag the worker checks between steps (ADR 0006).
 */
export const REMOVABLE_DELIVERY_JOB_STATES = [
  "waiting",
  "waiting-children",
  "delayed",
  "prioritized",
  "paused",
];

export function isRemovableDeliveryJobState(state) {
  return REMOVABLE_DELIVERY_JOB_STATES.includes(state);
}

/**
 * Best-effort removal of a queued delivery job.
 *
 * Never throws: a cancel must still be able to unlock the bill when Redis is
 * unreachable or the job flipped to `active` between the state read and the
 * remove call.
 *
 * @returns {Promise<{found: boolean, removed: boolean, state: string|null, error?: Error}>}
 */
export async function removeWhatsAppBillDeliveryJob(jobId) {
  if (!jobId) {
    return { found: false, removed: false, state: null };
  }

  try {
    const queue = getWhatsAppBillDeliveryQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return { found: false, removed: false, state: null };
    }

    const state = await job.getState();
    if (!isRemovableDeliveryJobState(state)) {
      return { found: true, removed: false, state };
    }

    await job.remove();
    return { found: true, removed: true, state };
  } catch (error) {
    return { found: false, removed: false, state: null, error };
  }
}
