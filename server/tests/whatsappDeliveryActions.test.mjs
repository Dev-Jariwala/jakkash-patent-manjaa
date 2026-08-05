import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isRemovableDeliveryJobState,
  REMOVABLE_DELIVERY_JOB_STATES,
  WHATSAPP_BILL_DELIVERY_JOB_OPTIONS,
} from "../queues/whatsappBillDeliveryQueue.js";
import {
  OPERATOR_CANCEL_OVERWRITABLE_STATUSES,
  WORKER_CANCEL_OVERWRITABLE_STATUSES,
} from "../services/whatsappBillDeliveryPersistence.js";
import {
  buildCanceledWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  CANCELABLE_WHATSAPP_DELIVERY_STATUSES,
  createInitialWhatsAppMetadata,
  evaluateWhatsAppCancelEligibility,
  evaluateWhatsAppResendEligibility,
  RESENDABLE_WHATSAPP_DELIVERY_STATUSES,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";
import { processingMetadata } from "./helpers/fixtures.mjs";

function settledMetadataByStatus() {
  return {
    [WHATSAPP_DELIVERY_STATUS.NO]: createInitialWhatsAppMetadata(),
    [WHATSAPP_DELIVERY_STATUS.SUCCESS]: buildSuccessWhatsAppMetadata(processingMetadata(), {
      providerMessageId: "wamid.ok",
    }),
    [WHATSAPP_DELIVERY_STATUS.FAILED]: buildFailedWhatsAppMetadata(
      processingMetadata(),
      new Error("provider rejected")
    ),
    [WHATSAPP_DELIVERY_STATUS.CANCELED]: buildCanceledWhatsAppMetadata(processingMetadata()),
  };
}

describe("resend eligibility", () => {
  it("allows a resend from every settled status", () => {
    for (const [status, metadata] of Object.entries(settledMetadataByStatus())) {
      const eligibility = evaluateWhatsAppResendEligibility(metadata);
      assert.equal(eligibility.allowed, true, `expected resend to be allowed from "${status}"`);
      assert.equal(eligibility.status, status);
    }

    assert.deepEqual(RESENDABLE_WHATSAPP_DELIVERY_STATUSES, [
      WHATSAPP_DELIVERY_STATUS.NO,
      WHATSAPP_DELIVERY_STATUS.SUCCESS,
      WHATSAPP_DELIVERY_STATUS.FAILED,
      WHATSAPP_DELIVERY_STATUS.CANCELED,
    ]);
  });

  it("blocks a resend while a delivery is in flight", () => {
    // Only one attempt per bill at a time (PRD 25), otherwise the client gets
    // two copies and two jobs race to write the outcome.
    const eligibility = evaluateWhatsAppResendEligibility(processingMetadata());

    assert.equal(eligibility.allowed, false);
    assert.equal(eligibility.reason, "delivery_in_progress");
    assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
    assert.match(eligibility.message, /in progress/i);
  });

  it("treats a bill from before the feature as never sent", () => {
    assert.equal(evaluateWhatsAppResendEligibility(null).allowed, true);
    assert.equal(evaluateWhatsAppResendEligibility(null).status, WHATSAPP_DELIVERY_STATUS.NO);
    assert.equal(evaluateWhatsAppResendEligibility({}).allowed, true);
  });

  it("refuses a status it does not recognise", () => {
    const eligibility = evaluateWhatsAppResendEligibility({ status: "queued-forever" });

    assert.equal(eligibility.allowed, false);
    assert.equal(eligibility.reason, "unsupported_status");
  });
});

describe("force cancel eligibility", () => {
  it("allows a cancel only while a delivery is in flight", () => {
    assert.deepEqual(CANCELABLE_WHATSAPP_DELIVERY_STATUSES, [
      WHATSAPP_DELIVERY_STATUS.PROCESSING,
    ]);

    const eligibility = evaluateWhatsAppCancelEligibility(processingMetadata());
    assert.equal(eligibility.allowed, true);
    assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
  });

  it("refuses a cancel on a settled delivery, and says why", () => {
    const settled = settledMetadataByStatus();
    const alreadyCanceled = evaluateWhatsAppCancelEligibility(
      settled[WHATSAPP_DELIVERY_STATUS.CANCELED]
    );
    // A second cancel gets its own reason so the operator sees what happened.
    assert.equal(alreadyCanceled.allowed, false);
    assert.equal(alreadyCanceled.reason, "already_canceled");

    delete settled[WHATSAPP_DELIVERY_STATUS.CANCELED];
    for (const [status, metadata] of Object.entries(settled)) {
      const eligibility = evaluateWhatsAppCancelEligibility(metadata);
      assert.equal(eligibility.allowed, false, `expected cancel to be blocked from "${status}"`);
      assert.equal(eligibility.reason, "delivery_not_in_progress");
      assert.equal(eligibility.status, status);
    }
  });

  it("treats a bill from before the feature as nothing to cancel", () => {
    assert.equal(evaluateWhatsAppCancelEligibility(null).allowed, false);
    assert.equal(evaluateWhatsAppCancelEligibility(null).status, WHATSAPP_DELIVERY_STATUS.NO);
    assert.equal(evaluateWhatsAppCancelEligibility({}).allowed, false);
  });

  it("unlocks a resend once the delivery is canceled", () => {
    // Force cancel exists to unlock the bill (PRD 30); a canceled bill that
    // could not be resent would be a dead end.
    const canceled = buildCanceledWhatsAppMetadata(processingMetadata());
    const eligibility = evaluateWhatsAppResendEligibility(canceled);

    assert.equal(eligibility.allowed, true);
    assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
  });
});

describe("delivery queue job handling", () => {
  it("removes only jobs the worker has not started", () => {
    for (const state of REMOVABLE_DELIVERY_JOB_STATES) {
      assert.equal(isRemovableDeliveryJobState(state), true, `"${state}" should be removable`);
    }

    // An active job is already running; BullMQ cannot drop it, so cancellation
    // falls back to the metadata flag the worker checks between steps.
    for (const state of ["active", "completed", "failed", "unknown"]) {
      assert.equal(isRemovableDeliveryJobState(state), false, `"${state}" should not be removable`);
    }
  });

  it("never retries a delivery automatically", () => {
    // A retry would deliver a duplicate bill the operator never asked for
    // (PRD 28); every retry is a user-triggered resend.
    assert.equal(WHATSAPP_BILL_DELIVERY_JOB_OPTIONS.attempts, 1);
  });

  it("bounds how long failed jobs are kept in Redis", () => {
    // The bill's metadata is the durable record; the Redis copy only needs to
    // outlive the debugging window.
    const { removeOnFail } = WHATSAPP_BILL_DELIVERY_JOB_OPTIONS;

    assert.notEqual(removeOnFail, false, "unbounded retention grows the queue forever");
    assert.ok(removeOnFail.age > 0);
    assert.ok(removeOnFail.count > 0);
  });
});

describe("guarded write windows", () => {
  it("stops the operator's cancel from relabelling a settled outcome", () => {
    // The delivery can settle between the eligibility read and the write; a bill
    // that genuinely reached the client must keep its `success`.
    assert.deepEqual(OPERATOR_CANCEL_OVERWRITABLE_STATUSES, [
      WHATSAPP_DELIVERY_STATUS.PROCESSING,
    ]);

    for (const status of [
      WHATSAPP_DELIVERY_STATUS.SUCCESS,
      WHATSAPP_DELIVERY_STATUS.FAILED,
      WHATSAPP_DELIVERY_STATUS.CANCELED,
      WHATSAPP_DELIVERY_STATUS.NO,
    ]) {
      assert.equal(
        OPERATOR_CANCEL_OVERWRITABLE_STATUSES.includes(status),
        false,
        `cancel must not overwrite "${status}"`
      );
    }
  });

  it("lets the worker confirm only the cancel it observed", () => {
    // Either the operator's `canceled` write or a `cancel_requested` flag still
    // sitting on `processing`.
    assert.deepEqual(WORKER_CANCEL_OVERWRITABLE_STATUSES, [
      WHATSAPP_DELIVERY_STATUS.PROCESSING,
      WHATSAPP_DELIVERY_STATUS.CANCELED,
    ]);

    for (const status of [WHATSAPP_DELIVERY_STATUS.SUCCESS, WHATSAPP_DELIVERY_STATUS.FAILED]) {
      assert.equal(
        WORKER_CANCEL_OVERWRITABLE_STATUSES.includes(status),
        false,
        `worker cancel finalization must not overwrite "${status}"`
      );
    }
  });
});
