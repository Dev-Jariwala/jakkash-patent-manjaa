import { fileURLToPath } from "url";
import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { WHATSAPP_BILL_DELIVERY_QUEUE_NAME } from "../queues/whatsappBillDeliveryQueue.js";
import { processWhatsAppBillDeliveryJob } from "./processWhatsAppBillDeliveryJob.js";

export function startWhatsAppBillDeliveryWorker() {
  const concurrency = Number(process.env.WHATSAPP_DELIVERY_WORKER_CONCURRENCY || 2);

  const worker = new Worker(
    WHATSAPP_BILL_DELIVERY_QUEUE_NAME,
    processWhatsAppBillDeliveryJob,
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on("completed", (job) => {
    console.log(
      `[whatsapp-delivery-worker] Queue job ${job.id} processed (stub — WhatsApp not sent)`
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[whatsapp-delivery-worker] Queue job ${job?.id} failed before stub handler finished:`,
      error
    );
  });

  worker.on("error", (error) => {
    console.error("[whatsapp-delivery-worker] Worker error:", error);
  });

  console.log(
    `[whatsapp-delivery-worker] Listening on queue "${WHATSAPP_BILL_DELIVERY_QUEUE_NAME}" (concurrency: ${concurrency})`
  );

  return worker;
}

async function shutdown(worker, signal) {
  console.log(`[whatsapp-delivery-worker] Received ${signal}, shutting down...`);
  await worker.close();
  process.exit(0);
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const worker = startWhatsAppBillDeliveryWorker();
  process.on("SIGINT", () => shutdown(worker, "SIGINT"));
  process.on("SIGTERM", () => shutdown(worker, "SIGTERM"));
}
