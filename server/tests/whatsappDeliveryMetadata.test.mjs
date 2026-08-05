import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildBillDeliveryJobId,
  buildCanceledWhatsAppMetadata,
  buildEnqueueFailedWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
  buildProviderAcceptedWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  createInitialWhatsAppMetadata,
  evaluateWhatsAppDeliveryJobState,
  resolveCreateBillWhatsAppMetadata,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";
import { processingMetadata } from "./helpers/fixtures.mjs";

/** Every field migration 003 guarantees on the column. */
const CANONICAL_METADATA_KEYS = [
  "status",
  "delivery_requested",
  "delivery_requested_at",
  "processing_started_at",
  "completed_at",
  "error_message",
  "provider_message_id",
  "provider_accepted_at",
  "queue_job_id",
  "cancel_requested",
  "canceled_at",
];

describe("WhatsApp delivery metadata", () => {
  it("seeds a new bill with the canonical shape", () => {
    // The column default in the migration and this builder are two independent
    // definitions of the same object; a bill can be created through either.
    assert.deepEqual(
      Object.keys(createInitialWhatsAppMetadata()).sort(),
      [...CANONICAL_METADATA_KEYS].sort()
    );
    assert.equal(createInitialWhatsAppMetadata().status, WHATSAPP_DELIVERY_STATUS.NO);
  });

  it("keeps every transition on the canonical shape", () => {
    const transitions = {
      processing: processingMetadata(),
      accepted: buildProviderAcceptedWhatsAppMetadata(processingMetadata(), {
        providerMessageId: "wamid.1",
      }),
      success: buildSuccessWhatsAppMetadata(processingMetadata(), {
        providerMessageId: "wamid.1",
      }),
      failed: buildFailedWhatsAppMetadata(processingMetadata(), new Error("nope")),
      canceled: buildCanceledWhatsAppMetadata(processingMetadata()),
      enqueueFailed: buildEnqueueFailedWhatsAppMetadata(
        createInitialWhatsAppMetadata({ deliveryRequested: true }),
        new Error("redis down")
      ),
    };

    for (const [name, metadata] of Object.entries(transitions)) {
      assert.deepEqual(
        Object.keys(metadata).sort(),
        [...CANONICAL_METADATA_KEYS].sort(),
        `"${name}" drifted from the canonical metadata shape`
      );
    }
  });

  it("gives every attempt its own queue job id", () => {
    // A deterministic id would collide with the previous attempt still held in
    // Redis and make resend impossible for that bill.
    const first = buildBillDeliveryJobId(42);
    const second = buildBillDeliveryJobId(42);

    assert.notEqual(first, second);
    assert.match(first, /^bill-42-[0-9a-f-]{36}$/);
  });

  it("records a delivery that could not be queued as failed, not processing", () => {
    // Redis being down must not leave the bill stuck in `processing`, which
    // would block both editing and resend with no job to cancel.
    const failed = buildEnqueueFailedWhatsAppMetadata(
      createInitialWhatsAppMetadata({ deliveryRequested: true }),
      new Error("redis down")
    );

    assert.equal(failed.status, WHATSAPP_DELIVERY_STATUS.FAILED);
    assert.equal(failed.queue_job_id, null);
    assert.match(failed.error_message, /redis down/);
  });

  it("preserves the provider fields when a failure follows an acceptance", () => {
    // Losing the message id here would hide the fact that a copy already went
    // out, and the operator would resend a duplicate.
    const accepted = buildProviderAcceptedWhatsAppMetadata(processingMetadata(), {
      providerMessageId: "wamid.accepted",
    });

    const failed = buildFailedWhatsAppMetadata(accepted, new Error("persistence failed"));

    assert.equal(failed.status, WHATSAPP_DELIVERY_STATUS.FAILED);
    assert.equal(failed.provider_message_id, "wamid.accepted");
    assert.equal(failed.provider_accepted_at, accepted.provider_accepted_at);
  });

  it("marks a cancel as final and distinct from a failure", () => {
    const canceled = buildCanceledWhatsAppMetadata(processingMetadata());

    assert.equal(canceled.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
    assert.equal(canceled.cancel_requested, true);
    assert.ok(canceled.canceled_at, "canceled_at must be stamped");
    assert.ok(canceled.completed_at, "completed_at must be stamped");
    // A deliberate cancel is not a provider problem, so no error text is shown.
    assert.equal(canceled.error_message, null);
  });

  it("keeps the operator's cancel timestamp when the worker confirms it", () => {
    const canceledByOperator = buildCanceledWhatsAppMetadata(processingMetadata());
    const finalizedByWorker = buildCanceledWhatsAppMetadata(canceledByOperator);

    assert.equal(finalizedByWorker.canceled_at, canceledByOperator.canceled_at);
    assert.equal(finalizedByWorker.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
  });

  it("starts a resend from a clean slate", () => {
    const succeeded = buildSuccessWhatsAppMetadata(processingMetadata("job-old"), {
      providerMessageId: "wamid.first",
    });

    const resendJobId = buildBillDeliveryJobId(11);
    const resent = buildProcessingWhatsAppMetadata(succeeded, {
      queueJobId: resendJobId,
      resetRequestedAt: true,
    });

    assert.equal(resent.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
    assert.equal(resent.queue_job_id, resendJobId);
    assert.notEqual(resent.queue_job_id, succeeded.queue_job_id);
    // The previous attempt's outcome must not leak into the new one.
    assert.equal(resent.provider_message_id, null);
    assert.equal(resent.provider_accepted_at, null);
    assert.equal(resent.completed_at, null);
    assert.equal(resent.error_message, null);
    // A leftover cancel flag would make the worker abort the fresh attempt.
    assert.equal(resent.cancel_requested, false);
    assert.equal(resent.canceled_at, null);
  });

  it("refreshes the requested-at stamp on resend but not on create", () => {
    const original = createInitialWhatsAppMetadata({ deliveryRequested: true });
    original.delivery_requested_at = "2020-01-01T00:00:00.000Z";

    const created = buildProcessingWhatsAppMetadata(original, { queueJobId: "job-create" });
    assert.equal(created.delivery_requested_at, "2020-01-01T00:00:00.000Z");

    const resent = buildProcessingWhatsAppMetadata(original, {
      queueJobId: "job-resend",
      resetRequestedAt: true,
    });
    assert.notEqual(resent.delivery_requested_at, "2020-01-01T00:00:00.000Z");
    // The processing(XXs) timer reads processing_started_at first, so it restarts.
    assert.ok(new Date(resent.processing_started_at).getTime() > 0);
  });

  describe("job state evaluation", () => {
    it("continues only for the job that currently owns the bill", () => {
      const metadata = processingMetadata("job-a");

      assert.deepEqual(evaluateWhatsAppDeliveryJobState(metadata, "job-a"), {
        action: "continue",
      });
      assert.deepEqual(evaluateWhatsAppDeliveryJobState(metadata, "job-b"), {
        action: "skip",
        reason: "stale_job",
        status: WHATSAPP_DELIVERY_STATUS.PROCESSING,
      });
    });

    it("stops on a cancel request and on a recorded cancel", () => {
      const cancelRequested = { ...processingMetadata("job-a"), cancel_requested: true };
      assert.equal(evaluateWhatsAppDeliveryJobState(cancelRequested, "job-a").action, "canceled");

      const canceled = buildCanceledWhatsAppMetadata(processingMetadata("job-a"));
      assert.equal(evaluateWhatsAppDeliveryJobState(canceled, "job-a").action, "canceled");
    });

    it("prefers stale-job over cancel once a resend has taken over", () => {
      // Otherwise the old job would write `canceled` over the new attempt.
      const resent = buildProcessingWhatsAppMetadata(
        buildCanceledWhatsAppMetadata(processingMetadata("job-old")),
        { queueJobId: "job-new", resetRequestedAt: true }
      );

      const oldJobState = evaluateWhatsAppDeliveryJobState(resent, "job-old");
      assert.equal(oldJobState.action, "skip");
      assert.equal(oldJobState.reason, "stale_job");
      assert.equal(evaluateWhatsAppDeliveryJobState(resent, "job-new").action, "continue");
    });

    it("aborts when the bill carries no metadata at all", () => {
      assert.deepEqual(evaluateWhatsAppDeliveryJobState(null, "job-a"), {
        action: "abort",
        reason: "metadata_missing",
      });
    });
  });

  describe("create-flow gating", () => {
    it("requests delivery only when the service is on and the box is checked", () => {
      const requested = resolveCreateBillWhatsAppMetadata({
        serviceEnabled: true,
        sendBillOnWhatsApp: true,
      });

      assert.equal(requested.delivery_requested, true);
      assert.ok(requested.delivery_requested_at);
      // The bill is created first; only the enqueue moves it to `processing`.
      assert.equal(requested.status, WHATSAPP_DELIVERY_STATUS.NO);
    });

    it("leaves the bill alone when the operator unchecks the box", () => {
      const skipped = resolveCreateBillWhatsAppMetadata({
        serviceEnabled: true,
        sendBillOnWhatsApp: false,
      });

      assert.equal(skipped.delivery_requested, false);
      assert.equal(skipped.delivery_requested_at, null);
      assert.equal(skipped.status, WHATSAPP_DELIVERY_STATUS.NO);
    });

    it("ignores a checked box when the service is off", () => {
      // A stale frontend can still submit the flag; the setting decides.
      const blocked = resolveCreateBillWhatsAppMetadata({
        serviceEnabled: false,
        sendBillOnWhatsApp: true,
      });

      assert.equal(blocked.delivery_requested, false);
      assert.equal(blocked.status, WHATSAPP_DELIVERY_STATUS.NO);
    });
  });
});
