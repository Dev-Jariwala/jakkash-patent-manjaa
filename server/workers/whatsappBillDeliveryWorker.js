import { fileURLToPath } from "url";
import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { WHATSAPP_BILL_DELIVERY_QUEUE_NAME } from "../queues/whatsappBillDeliveryQueue.js";
import { describeWhatsAppProviderConfig } from "../services/whatsappProvider.js";
import { processWhatsAppBillDeliveryJob } from "./processWhatsAppBillDeliveryJob.js";

export const DEFAULT_WORKER_CONCURRENCY = 2;
/** How long a shutdown waits for in-flight jobs before forcing the exit. */
const SHUTDOWN_GRACE_MS = 20000;

export function resolveWorkerConcurrency(rawValue) {
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WORKER_CONCURRENCY;
}

/**
 * Provider credentials are only read when a job runs, so a worker started
 * without them looks healthy and then fails every single delivery. Say it once,
 * loudly, at boot. It is a warning rather than a fatal error because the worker
 * still has useful work to do: it drains the queue and records the failures the
 * operator needs to see on each bill.
 */
function warnOnMissingProviderConfig() {
  const { configured, missing } = describeWhatsAppProviderConfig();

  if (!configured) {
    console.error(
      `[whatsapp-delivery-worker] WhatsApp provider is not configured (missing: ${missing.join(", ")}). ` +
      `Every delivery will fail with a config error until these are set.`
    );
  }

  return configured;
}

export function startWhatsAppBillDeliveryWorker() {
  const concurrency = resolveWorkerConcurrency(
    process.env.WHATSAPP_DELIVERY_WORKER_CONCURRENCY
  );

  warnOnMissingProviderConfig();

  const worker = new Worker(
    WHATSAPP_BILL_DELIVERY_QUEUE_NAME,
    processWhatsAppBillDeliveryJob,
    {
      connection: createRedisConnection(),
      concurrency,
    }
  );

  worker.on("completed", (job, result) => {
    const status = result?.status || "completed";
    console.log(`[whatsapp-delivery-worker] Queue job ${job.id} finished with status "${status}"`);
  });

  worker.on("failed", (job, error) => {
    if (error?.code === "WHATSAPP_DELIVERY_PERSISTENCE_FAILED_AFTER_SEND") {
      console.error(
        `[whatsapp-delivery-worker] Queue job ${job?.id} failed after provider accepted send (message ${error.providerMessageId}) — reconciliation required:`,
        error.cause || error
      );
      return;
    }

    console.error(`[whatsapp-delivery-worker] Queue job ${job?.id} failed:`, error);
  });

  worker.on("error", (error) => {
    console.error("[whatsapp-delivery-worker] Worker error:", error);
  });

  console.log(
    `[whatsapp-delivery-worker] Listening on queue "${WHATSAPP_BILL_DELIVERY_QUEUE_NAME}" (concurrency: ${concurrency})`
  );

  return worker;
}

/**
 * Stops taking new jobs and lets the ones already in flight finish, so a deploy
 * does not strand a bill in `processing` with no worker left to settle it. The
 * grace timer bounds that wait: a job stuck on an unresponsive provider must not
 * keep the process alive indefinitely.
 */
async function shutdown(worker, signal) {
  console.log(`[whatsapp-delivery-worker] Received ${signal}, finishing in-flight jobs...`);

  const forceExit = setTimeout(() => {
    console.error(
      `[whatsapp-delivery-worker] Shutdown exceeded ${SHUTDOWN_GRACE_MS}ms; exiting with jobs still in flight`
    );
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);
  forceExit.unref();

  try {
    await worker.close();
    console.log("[whatsapp-delivery-worker] Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("[whatsapp-delivery-worker] Shutdown failed:", error);
    process.exit(1);
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  const worker = startWhatsAppBillDeliveryWorker();

  let shuttingDown = false;
  const requestShutdown = (signal) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    shutdown(worker, signal);
  };

  process.on("SIGINT", () => requestShutdown("SIGINT"));
  process.on("SIGTERM", () => requestShutdown("SIGTERM"));

  // A rejection escaping the job handler would otherwise take the process down
  // silently under Node's default, leaving the queue unattended.
  process.on("unhandledRejection", (reason) => {
    console.error("[whatsapp-delivery-worker] Unhandled rejection:", reason);
  });

  process.on("uncaughtException", (error) => {
    console.error("[whatsapp-delivery-worker] Uncaught exception; shutting down:", error);
    requestShutdown("uncaughtException");
  });
}
