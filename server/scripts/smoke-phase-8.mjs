import assert from "node:assert/strict";
import { handleError } from "../utils/error.js";
import { WhatsAppCancelNotAllowedError } from "../services/whatsappBillDeliveryCancel.js";
import { BillNotFoundError } from "../services/whatsappBillDeliveryErrors.js";
import { isRemovableDeliveryJobState } from "../queues/whatsappBillDeliveryQueue.js";
import {
  OPERATOR_CANCEL_OVERWRITABLE_STATUSES,
  WORKER_CANCEL_OVERWRITABLE_STATUSES,
} from "../services/whatsappBillDeliveryPersistence.js";
import {
  buildCanceledWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  CANCELABLE_WHATSAPP_DELIVERY_STATUSES,
  createInitialWhatsAppMetadata,
  evaluateWhatsAppCancelEligibility,
  evaluateWhatsAppDeliveryJobState,
  evaluateWhatsAppResendEligibility,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";

function createMockResponse() {
  const response = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return response;
}

function processingMetadata(queueJobId = "job-a") {
  return buildProcessingWhatsAppMetadata(
    createInitialWhatsAppMetadata({ deliveryRequested: true }),
    { queueJobId }
  );
}

function testCancelAllowedOnlyWhileProcessing() {
  assert.deepEqual(CANCELABLE_WHATSAPP_DELIVERY_STATUSES, [
    WHATSAPP_DELIVERY_STATUS.PROCESSING,
  ]);

  const eligibility = evaluateWhatsAppCancelEligibility(processingMetadata());
  assert.equal(eligibility.allowed, true);
  assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
}

function testCancelBlockedFromSettledStatuses() {
  const settled = {
    [WHATSAPP_DELIVERY_STATUS.NO]: createInitialWhatsAppMetadata(),
    [WHATSAPP_DELIVERY_STATUS.SUCCESS]: buildSuccessWhatsAppMetadata(processingMetadata(), {
      providerMessageId: "wamid.ok",
    }),
    [WHATSAPP_DELIVERY_STATUS.FAILED]: buildFailedWhatsAppMetadata(
      processingMetadata(),
      new Error("provider rejected")
    ),
  };

  for (const [status, metadata] of Object.entries(settled)) {
    const eligibility = evaluateWhatsAppCancelEligibility(metadata);
    assert.equal(eligibility.allowed, false, `expected cancel to be blocked from "${status}"`);
    assert.equal(eligibility.reason, "delivery_not_in_progress");
    assert.equal(eligibility.status, status);
  }

  // A second cancel gets its own reason so the operator sees what happened.
  const alreadyCanceled = evaluateWhatsAppCancelEligibility(
    buildCanceledWhatsAppMetadata(processingMetadata())
  );
  assert.equal(alreadyCanceled.allowed, false);
  assert.equal(alreadyCanceled.reason, "already_canceled");
}

function testCancelTreatsMissingMetadataAsNothingToCancel() {
  assert.equal(evaluateWhatsAppCancelEligibility(null).allowed, false);
  assert.equal(evaluateWhatsAppCancelEligibility(null).status, WHATSAPP_DELIVERY_STATUS.NO);
  assert.equal(evaluateWhatsAppCancelEligibility({}).allowed, false);
}

function testCanceledMetadataIsFinalAndDistinctFromFailed() {
  const canceled = buildCanceledWhatsAppMetadata(processingMetadata());

  assert.equal(canceled.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
  assert.notEqual(canceled.status, WHATSAPP_DELIVERY_STATUS.FAILED);
  assert.equal(canceled.cancel_requested, true);
  assert.ok(canceled.canceled_at, "canceled_at must be stamped");
  assert.ok(canceled.completed_at, "completed_at must be stamped");
  // A deliberate cancel is not a provider problem, so no error text is shown.
  assert.equal(canceled.error_message, null);
}

function testCancelTimestampIsNotOverwrittenByWorkerFinalization() {
  const canceledByOperator = buildCanceledWhatsAppMetadata(processingMetadata());
  const finalizedByWorker = buildCanceledWhatsAppMetadata(canceledByOperator);

  assert.equal(finalizedByWorker.canceled_at, canceledByOperator.canceled_at);
  assert.equal(finalizedByWorker.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
}

function testWorkerStopsOnCancelRequestBeforeStatusFlips() {
  // The cancel endpoint writes `canceled` directly, but a metadata-only cancel
  // request must also stop an active worker (ADR 0006).
  const cancelRequested = { ...processingMetadata("job-a"), cancel_requested: true };
  assert.equal(evaluateWhatsAppDeliveryJobState(cancelRequested, "job-a").action, "canceled");

  const canceled = buildCanceledWhatsAppMetadata(processingMetadata("job-a"));
  assert.equal(evaluateWhatsAppDeliveryJobState(canceled, "job-a").action, "canceled");
}

function testWorkerPrefersStaleJobOverCancelForAnOldAttempt() {
  // Cancel then resend: the old job must skip rather than write `canceled` over
  // the new attempt's `processing` state.
  const resent = buildProcessingWhatsAppMetadata(
    buildCanceledWhatsAppMetadata(processingMetadata("job-old")),
    { queueJobId: "job-new", resetRequestedAt: true }
  );

  const oldJobState = evaluateWhatsAppDeliveryJobState(resent, "job-old");
  assert.equal(oldJobState.action, "skip");
  assert.equal(oldJobState.reason, "stale_job");

  assert.equal(evaluateWhatsAppDeliveryJobState(resent, "job-new").action, "continue");
}

function testResendIsAvailableAfterCancel() {
  // Force-cancel exists to unlock the bill, so the canceled state must be
  // resendable (PRD 30).
  const canceled = buildCanceledWhatsAppMetadata(processingMetadata());
  const eligibility = evaluateWhatsAppResendEligibility(canceled);

  assert.equal(eligibility.allowed, true);
  assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.CANCELED);
}

function testResendAfterCancelClearsCancelState() {
  const canceled = buildCanceledWhatsAppMetadata(processingMetadata("job-old"));
  const resent = buildProcessingWhatsAppMetadata(canceled, {
    queueJobId: "job-new",
    resetRequestedAt: true,
  });

  // A leftover cancel flag would make the worker abort the fresh attempt.
  assert.equal(resent.cancel_requested, false);
  assert.equal(resent.canceled_at, null);
  assert.equal(resent.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
}

function testOnlyUnstartedJobStatesAreRemovable() {
  for (const state of ["waiting", "waiting-children", "delayed", "prioritized", "paused"]) {
    assert.equal(isRemovableDeliveryJobState(state), true, `"${state}" should be removable`);
  }

  // An active job is already running; BullMQ cannot drop it, so cancellation
  // falls back to the metadata flag the worker checks between steps.
  for (const state of ["active", "completed", "failed", "unknown"]) {
    assert.equal(isRemovableDeliveryJobState(state), false, `"${state}" should not be removable`);
  }
}

function testOperatorCancelNeverOverwritesASettledOutcome() {
  // The guarded UPDATE must not relabel a delivery that actually reached the
  // client (or genuinely failed) between the eligibility read and the write.
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
}

function testWorkerCancelFinalizationOnlyConfirmsItsOwnCancel() {
  // The worker confirms a cancel it observed: either the operator's `canceled`
  // write or a `cancel_requested` flag still sitting on `processing`.
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
}

function testCancelNotAllowedErrorSurfacesAs409() {
  const res = createMockResponse();
  const eligibility = evaluateWhatsAppCancelEligibility(createInitialWhatsAppMetadata());

  handleError("forceCancelBillWhatsAppDelivery", res, new WhatsAppCancelNotAllowedError(eligibility));

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, "WHATSAPP_CANCEL_NOT_ALLOWED");
  assert.match(res.body.message, /nothing to cancel/i);
}

function testBillNotFoundErrorSurfacesAs404() {
  const res = createMockResponse();

  handleError("forceCancelBillWhatsAppDelivery", res, new BillNotFoundError());

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.code, "BILL_NOT_FOUND");
}

function run() {
  testCancelAllowedOnlyWhileProcessing();
  testCancelBlockedFromSettledStatuses();
  testCancelTreatsMissingMetadataAsNothingToCancel();
  testCanceledMetadataIsFinalAndDistinctFromFailed();
  testCancelTimestampIsNotOverwrittenByWorkerFinalization();
  testWorkerStopsOnCancelRequestBeforeStatusFlips();
  testWorkerPrefersStaleJobOverCancelForAnOldAttempt();
  testResendIsAvailableAfterCancel();
  testResendAfterCancelClearsCancelState();
  testOnlyUnstartedJobStatesAreRemovable();
  testOperatorCancelNeverOverwritesASettledOutcome();
  testWorkerCancelFinalizationOnlyConfirmsItsOwnCancel();
  testCancelNotAllowedErrorSurfacesAs409();
  testBillNotFoundErrorSurfacesAs404();

  console.log("Phase 8 smoke tests passed");
}

try {
  run();
} catch (error) {
  console.error("Phase 8 smoke tests failed:", error);
  process.exit(1);
}
