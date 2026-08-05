import assert from "node:assert/strict";
import { handleError } from "../utils/error.js";
import {
  BillNotFoundError,
  WhatsAppResendNotAllowedError,
} from "../services/whatsappBillDeliveryResend.js";
import {
  buildBillDeliveryJobId,
  buildCanceledWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  createInitialWhatsAppMetadata,
  evaluateWhatsAppResendEligibility,
  RESENDABLE_WHATSAPP_DELIVERY_STATUSES,
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

function testResendAllowedFromEveryTerminalStatus() {
  const terminal = {
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

  for (const [status, metadata] of Object.entries(terminal)) {
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
}

function testResendBlockedWhileProcessing() {
  const eligibility = evaluateWhatsAppResendEligibility(processingMetadata());

  assert.equal(eligibility.allowed, false);
  assert.equal(eligibility.reason, "delivery_in_progress");
  assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
  assert.match(eligibility.message, /in progress/i);
}

function testResendTreatsMissingMetadataAsNeverSent() {
  // Bills created before the feature shipped can have an empty column.
  assert.equal(evaluateWhatsAppResendEligibility(null).allowed, true);
  assert.equal(evaluateWhatsAppResendEligibility(null).status, WHATSAPP_DELIVERY_STATUS.NO);
  assert.equal(evaluateWhatsAppResendEligibility({}).allowed, true);
}

function testResendRejectsUnknownStatus() {
  const eligibility = evaluateWhatsAppResendEligibility({ status: "queued-forever" });

  assert.equal(eligibility.allowed, false);
  assert.equal(eligibility.reason, "unsupported_status");
}

function testResendFromSuccessStartsACleanAttempt() {
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
  assert.equal(resent.cancel_requested, false);
  assert.equal(resent.canceled_at, null);
}

function testResendRefreshesRequestedAtButCreateDoesNot() {
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
}

function testResendNotAllowedErrorSurfacesAs409() {
  const res = createMockResponse();
  const eligibility = evaluateWhatsAppResendEligibility(processingMetadata());

  handleError("resendBillWhatsAppDelivery", res, new WhatsAppResendNotAllowedError(eligibility));

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, "WHATSAPP_RESEND_NOT_ALLOWED");
  assert.match(res.body.message, /in progress/i);
}

function testBillNotFoundErrorSurfacesAs404() {
  const res = createMockResponse();

  handleError("resendBillWhatsAppDelivery", res, new BillNotFoundError());

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.code, "BILL_NOT_FOUND");
}

function run() {
  testResendAllowedFromEveryTerminalStatus();
  testResendBlockedWhileProcessing();
  testResendTreatsMissingMetadataAsNeverSent();
  testResendRejectsUnknownStatus();
  testResendFromSuccessStartsACleanAttempt();
  testResendRefreshesRequestedAtButCreateDoesNot();
  testResendNotAllowedErrorSurfacesAs409();
  testBillNotFoundErrorSurfacesAs404();

  console.log("Phase 7 smoke tests passed");
}

try {
  run();
} catch (error) {
  console.error("Phase 7 smoke tests failed:", error);
  process.exit(1);
}
