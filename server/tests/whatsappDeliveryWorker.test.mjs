import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  defaultDeliveryDependencies,
  processWhatsAppBillDeliveryJob,
  WhatsAppDeliveryPersistenceAfterSendError,
} from "../workers/processWhatsAppBillDeliveryJob.js";
import {
  buildCanceledWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
  createInitialWhatsAppMetadata,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";
import { createBillDeliveryWorld, createJob } from "./helpers/billDeliveryWorld.mjs";
import { processingMetadata } from "./helpers/fixtures.mjs";

/**
 * Worker orchestration: the seam the PRD names as highest priority (PRD 45).
 *
 * Every case here drives the real job function with the database and the
 * provider replaced by a store that enforces the same write guards as the SQL,
 * so what is under test is the ordering — when the worker re-reads cancel state,
 * which write it lets lose, and what it reports back.
 */
describe("WhatsApp bill delivery worker", () => {
  it("delivers a processing bill and records success", async () => {
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });
    const job = createJob({ world });

    const result = await processWhatsAppBillDeliveryJob(job, world.deps);

    assert.equal(result.status, WHATSAPP_DELIVERY_STATUS.SUCCESS);
    assert.equal(result.providerMessageId, "wamid.1");
    assert.equal(world.metadata.status, WHATSAPP_DELIVERY_STATUS.SUCCESS);
    assert.equal(world.metadata.provider_message_id, "wamid.1");
    assert.ok(world.metadata.provider_accepted_at, "provider acceptance must be stamped");
    assert.ok(world.metadata.completed_at);
    assert.equal(world.metadata.error_message, null);
  });

  it("sends the bill exactly once, with the freshly generated document", async () => {
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });

    await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(world.calls.pdfGenerations, 1);
    assert.equal(world.calls.sends.length, 1, "no automatic retry may duplicate the bill");
    assert.equal(world.calls.sends[0].filename, "Jakkash-Bill-101.pdf");
    assert.equal(world.calls.sends[0].bill.bill_id, world.bill.bill_id);
  });

  it("never returns the generated PDF bytes to the queue", async () => {
    // The document is ephemeral (PRD 10); a buffer on the job result would be
    // persisted in Redis as part of the completed job.
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });

    const result = await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    for (const value of Object.values(result)) {
      assert.equal(Buffer.isBuffer(value), false);
    }
  });

  it("re-reads the bill before every irreversible step", async () => {
    // The cancel checkpoints are only real if the worker actually goes back to
    // the database: load, after PDF, before the acceptance write, before success.
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });

    await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(world.calls.fetches, 4);
  });

  it("stops before doing any work when the cancel is already recorded", async () => {
    const world = createBillDeliveryWorld({
      metadata: buildCanceledWhatsAppMetadata(processingMetadata("job-a")),
    });

    const result = await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(result.canceled, true);
    assert.equal(result.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
    assert.equal(world.calls.pdfGenerations, 0);
    assert.equal(world.calls.sends.length, 0);
  });

  it("aborts on a cancel request that has not yet flipped the status", async () => {
    // The operator's write and the worker's read can interleave; a bare
    // `cancel_requested` on a still-`processing` bill must stop the job too.
    const world = createBillDeliveryWorld({
      metadata: { ...processingMetadata("job-a"), cancel_requested: true },
    });

    const result = await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(result.canceled, true);
    assert.equal(world.metadata.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
    assert.equal(world.calls.sends.length, 0);
  });

  it("stops between PDF generation and the provider call when a cancel lands", async () => {
    // The most valuable checkpoint: the bill is never sent.
    const world = createBillDeliveryWorld({
      metadata: processingMetadata("job-a"),
      onFetch(current, fetchNumber) {
        if (fetchNumber === 2) {
          current.setMetadata(buildCanceledWhatsAppMetadata(current.metadata));
        }
      },
    });

    const result = await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(result.canceled, true);
    assert.equal(world.calls.pdfGenerations, 1);
    assert.equal(world.calls.sends.length, 0, "a canceled bill must not reach the client");
  });

  it("keeps the canceled state when the cancel lands after the provider accepted", async () => {
    // ADR 0006: cancel is best-effort once the message is out. The bill stays
    // canceled and the delivered copy is reported for reconciliation.
    const world = createBillDeliveryWorld({
      metadata: processingMetadata("job-a"),
      onFetch(current, fetchNumber) {
        if (fetchNumber === 3) {
          current.setMetadata(buildCanceledWhatsAppMetadata(current.metadata));
        }
      },
    });

    const result = await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(result.canceled, true);
    assert.equal(world.calls.sends.length, 1);
    assert.equal(world.metadata.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
    assert.notEqual(world.metadata.status, WHATSAPP_DELIVERY_STATUS.SUCCESS);
  });

  it("never writes success over a cancel that beat the final write", async () => {
    // PRD 43. The checkpoint passes, then the cancel lands in the gap before the
    // write; only the guarded UPDATE can catch this one.
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });
    const originalPersist = world.deps.persistWhatsAppDeliveryOutcome;
    let writes = 0;

    world.deps.persistWhatsAppDeliveryOutcome = async (args) => {
      writes += 1;
      if (writes === 2) {
        world.setMetadata(buildCanceledWhatsAppMetadata(world.metadata));
      }
      return originalPersist(args);
    };

    const result = await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(result.canceled, true);
    assert.equal(result.providerMessageId, "wamid.1");
    assert.equal(world.metadata.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
  });

  it("skips without touching the bill once a resend has taken it over", async () => {
    // Cancel then resend: the old job must not write its outcome over the new
    // attempt's `processing` state.
    const resentMetadata = buildProcessingWhatsAppMetadata(
      buildCanceledWhatsAppMetadata(processingMetadata("job-old")),
      { queueJobId: "job-new", resetRequestedAt: true }
    );
    const world = createBillDeliveryWorld({ metadata: resentMetadata });

    const result = await processWhatsAppBillDeliveryJob(
      createJob({ world, jobId: "job-old" }),
      world.deps
    );

    assert.equal(result.skipped, true);
    assert.equal(world.calls.sends.length, 0);
    assert.equal(world.metadata.queue_job_id, "job-new");
    assert.equal(world.metadata.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
  });

  it("records a provider failure as failed and rethrows it", async () => {
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });
    world.deps.sendBillDocumentOnWhatsApp = async () => {
      throw new Error("provider rejected the template");
    };

    await assert.rejects(
      () => processWhatsAppBillDeliveryJob(createJob({ world }), world.deps),
      /provider rejected the template/
    );

    assert.equal(world.metadata.status, WHATSAPP_DELIVERY_STATUS.FAILED);
    assert.match(world.metadata.error_message, /provider rejected the template/);
    assert.ok(world.metadata.completed_at);
  });

  it("records a cancel rather than a failure when both happened", async () => {
    // A delivery that failed while the operator was canceling is the operator's
    // outcome, not a provider problem (PRD 24).
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });
    world.deps.sendBillDocumentOnWhatsApp = async () => {
      world.setMetadata({ ...world.metadata, cancel_requested: true });
      throw new Error("connection reset");
    };

    const result = await processWhatsAppBillDeliveryJob(createJob({ world }), world.deps);

    assert.equal(result.canceled, true);
    assert.equal(world.metadata.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
    assert.equal(world.metadata.error_message, null);
  });

  it("flags a send that succeeded but could not be recorded", async () => {
    // The one outcome no automatic rule can settle: the client has the bill but
    // the bill does not know it. It must surface for reconciliation, not retry.
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });
    world.deps.persistWhatsAppDeliveryOutcome = async () => {
      throw new Error("database unavailable");
    };

    await assert.rejects(
      () => processWhatsAppBillDeliveryJob(createJob({ world }), world.deps),
      (error) => {
        assert.ok(error instanceof WhatsAppDeliveryPersistenceAfterSendError);
        assert.equal(error.code, "WHATSAPP_DELIVERY_PERSISTENCE_FAILED_AFTER_SEND");
        assert.equal(error.providerMessageId, "wamid.1");
        return true;
      }
    );
  });

  it("refuses to run against a bill with no delivery metadata", async () => {
    const world = createBillDeliveryWorld({ metadata: null });

    await assert.rejects(
      () => processWhatsAppBillDeliveryJob(createJob({ world }), world.deps),
      (error) => {
        assert.equal(error.code, "WHATSAPP_METADATA_MISSING");
        return true;
      }
    );
    assert.equal(world.calls.sends.length, 0);
  });

  it("skips a bill that is no longer processing", async () => {
    const world = createBillDeliveryWorld({
      metadata: createInitialWhatsAppMetadata(),
    });

    const result = await processWhatsAppBillDeliveryJob(
      createJob({ world, jobId: null }),
      world.deps
    );

    assert.equal(result.skipped, true);
    assert.equal(result.status, WHATSAPP_DELIVERY_STATUS.NO);
    assert.equal(world.calls.sends.length, 0);
  });

  it("ignores the job token BullMQ passes as the second argument", async () => {
    // The processor is registered directly with BullMQ, which calls it as
    // `(job, token)`. A string there must fall through to the real defaults
    // rather than being spread over them as an override.
    const world = createBillDeliveryWorld({ metadata: processingMetadata("job-a") });
    const restore = { ...defaultDeliveryDependencies };
    Object.assign(defaultDeliveryDependencies, world.deps);

    try {
      const result = await processWhatsAppBillDeliveryJob(
        createJob({ world }),
        "bullmq-job-token"
      );
      assert.equal(result.status, WHATSAPP_DELIVERY_STATUS.SUCCESS);
    } finally {
      Object.assign(defaultDeliveryDependencies, restore);
    }
  });
});
