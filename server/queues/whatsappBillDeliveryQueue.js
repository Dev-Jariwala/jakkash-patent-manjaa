import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis.js";

export const WHATSAPP_BILL_DELIVERY_QUEUE_NAME = "whatsapp-bill-delivery";

/**
 * Failed jobs are kept so a delivery failure can be inspected in Redis, but
 * keeping them forever grows the queue without bound. The bill's
 * `whatsapp_metadata` is the durable record of the outcome, so the Redis copy
 * only needs to survive long enough to debug a recent failure.
 */
export const FAILED_JOB_RETENTION = {
  age: 7 * 24 * 60 * 60, // seconds
  count: 1000,
};

export const WHATSAPP_BILL_DELIVERY_JOB_OPTIONS = {
  removeOnComplete: true,
  removeOnFail: FAILED_JOB_RETENTION,
  // No automatic retries (PRD 28): every attempt is user-triggered, so a retry
  // here would deliver a duplicate bill the operator never asked for.
  attempts: 1,
};

let queueInstance = null;

export function getWhatsAppBillDeliveryQueue() {
  if (!queueInstance) {
    queueInstance = new Queue(WHATSAPP_BILL_DELIVERY_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: WHATSAPP_BILL_DELIVERY_JOB_OPTIONS,
    });
  }
  return queueInstance;
}

/**
 * Releases the queue's Redis connection so a shutting-down process does not hang
 * on an open socket. Safe to call when the queue was never created.
 */
export async function closeWhatsAppBillDeliveryQueue() {
  if (!queueInstance) {
    return;
  }

  const queue = queueInstance;
  queueInstance = null;
  await queue.close();
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
