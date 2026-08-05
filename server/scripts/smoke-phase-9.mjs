import assert from "node:assert/strict";
import { handleError } from "../utils/error.js";
import {
  BillEditBlockedError,
  BillUpdateFailedError,
  BILL_EDITABLE_SQL_CONDITION,
  EDIT_BLOCKING_STATUSES_PARAM,
} from "../services/whatsappBillEditGuard.js";
import {
  buildCanceledWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildProcessingWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  createInitialWhatsAppMetadata,
  evaluateBillEditEligibility,
  evaluateWhatsAppResendEligibility,
  EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES,
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

function testEditIsBlockedOnlyWhileProcessing() {
  assert.deepEqual(EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES, [
    WHATSAPP_DELIVERY_STATUS.PROCESSING,
  ]);

  const eligibility = evaluateBillEditEligibility(processingMetadata());
  assert.equal(eligibility.allowed, false);
  assert.equal(eligibility.reason, "delivery_in_progress");
  assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
  assert.match(eligibility.message, /force cancel/i);
}

function testEditIsAllowedFromEverySettledStatus() {
  const settled = {
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

  for (const [status, metadata] of Object.entries(settled)) {
    const eligibility = evaluateBillEditEligibility(metadata);
    assert.equal(eligibility.allowed, true, `expected edit to be allowed from "${status}"`);
    assert.equal(eligibility.status, status);
  }
}

function testLegacyBillsWithoutMetadataStayEditable() {
  // Bills created before the feature shipped carry no metadata; the lock must
  // not strand them.
  assert.equal(evaluateBillEditEligibility(null).allowed, true);
  assert.equal(evaluateBillEditEligibility(null).status, WHATSAPP_DELIVERY_STATUS.NO);
  assert.equal(evaluateBillEditEligibility({}).allowed, true);
}

function testForceCancelUnlocksEditing() {
  // The escape hatch out of the lock (PRD 30, ADR 0005).
  const canceled = buildCanceledWhatsAppMetadata(processingMetadata());

  assert.equal(evaluateBillEditEligibility(canceled).allowed, true);
  // ...and the unlocked bill can then be resent.
  assert.equal(evaluateWhatsAppResendEligibility(canceled).allowed, true);
}

function testUpdatedBillIsImmediatelyResendable() {
  // The post-update prompt reuses resend (PRD 32), so every status an edit can
  // start from must also accept a resend once the edit lands.
  for (const metadata of [
    createInitialWhatsAppMetadata(),
    buildSuccessWhatsAppMetadata(processingMetadata(), { providerMessageId: "wamid.ok" }),
    buildFailedWhatsAppMetadata(processingMetadata(), new Error("provider rejected")),
    buildCanceledWhatsAppMetadata(processingMetadata()),
  ]) {
    assert.equal(evaluateBillEditEligibility(metadata).allowed, true);
    assert.equal(
      evaluateWhatsAppResendEligibility(metadata).allowed,
      true,
      `an editable bill in "${metadata.status}" must also be resendable`
    );
  }
}

function testGuardedUpdateConditionMatchesTheEligibilityRule() {
  // The SQL guard closes the gap between the pre-check and the write, so it has
  // to refuse exactly the statuses the eligibility rule refuses.
  assert.equal(EDIT_BLOCKING_STATUSES_PARAM, EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES);

  const condition = BILL_EDITABLE_SQL_CONDITION("$16");
  assert.match(condition, /\$16::text\[\]/, "statuses must be bound, not interpolated");
  assert.match(
    condition,
    /COALESCE\(whatsapp_metadata->>'status', 'no'\)/,
    "missing metadata must read as 'no' so legacy bills stay editable"
  );
  assert.doesNotMatch(condition, /'processing'/, "status literals must not be inlined into SQL");
}

function testEditBlockedErrorSurfacesAs409() {
  const res = createMockResponse();
  const eligibility = evaluateBillEditEligibility(processingMetadata());

  handleError("updateBillById", res, new BillEditBlockedError(eligibility));

  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, "WHATSAPP_DELIVERY_IN_PROGRESS");
  assert.match(res.body.message, /cannot be edited/i);
}

function testUnattributableUpdateFailureKeepsIts400() {
  const res = createMockResponse();

  handleError("updateBillById", res, new BillUpdateFailedError());

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, "BILL_UPDATE_FAILED");
}

function run() {
  testEditIsBlockedOnlyWhileProcessing();
  testEditIsAllowedFromEverySettledStatus();
  testLegacyBillsWithoutMetadataStayEditable();
  testForceCancelUnlocksEditing();
  testUpdatedBillIsImmediatelyResendable();
  testGuardedUpdateConditionMatchesTheEligibilityRule();
  testEditBlockedErrorSurfacesAs409();
  testUnattributableUpdateFailureKeepsIts400();

  console.log("Phase 9 smoke tests passed");
}

try {
  run();
} catch (error) {
  console.error("Phase 9 smoke tests failed:", error);
  process.exit(1);
}
