import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  assertBillEditableFromMetadata,
  BillEditBlockedError,
  BILL_EDITABLE_SQL_CONDITION,
  EDIT_BLOCKING_STATUSES_PARAM,
} from "../services/whatsappBillEditGuard.js";
import {
  buildCanceledWhatsAppMetadata,
  buildFailedWhatsAppMetadata,
  buildSuccessWhatsAppMetadata,
  createInitialWhatsAppMetadata,
  evaluateBillEditEligibility,
  evaluateWhatsAppResendEligibility,
  EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";
import { processingMetadata } from "./helpers/fixtures.mjs";

describe("bill edit guard", () => {
  it("locks a bill only while its delivery is in flight", () => {
    // The worker generates the PDF from persisted data, so an edit landing
    // mid-attempt would send a document matching neither version (ADR 0005).
    assert.deepEqual(EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES, [
      WHATSAPP_DELIVERY_STATUS.PROCESSING,
    ]);

    const eligibility = evaluateBillEditEligibility(processingMetadata());
    assert.equal(eligibility.allowed, false);
    assert.equal(eligibility.reason, "delivery_in_progress");
    assert.equal(eligibility.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
    assert.match(eligibility.message, /force cancel/i);
  });

  it("allows editing from every settled status", () => {
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
  });

  it("leaves bills from before the feature editable", () => {
    assert.equal(evaluateBillEditEligibility(null).allowed, true);
    assert.equal(evaluateBillEditEligibility(null).status, WHATSAPP_DELIVERY_STATUS.NO);
    assert.equal(evaluateBillEditEligibility({}).allowed, true);
  });

  it("unlocks the bill after a force cancel, and lets it be resent", () => {
    // The whole point of the escape hatch (PRD 30).
    const canceled = buildCanceledWhatsAppMetadata(processingMetadata());

    assert.equal(evaluateBillEditEligibility(canceled).allowed, true);
    assert.equal(evaluateWhatsAppResendEligibility(canceled).allowed, true);
  });

  it("keeps every editable bill resendable", () => {
    // The post-update prompt reuses resend (PRD 32), so a bill that could be
    // edited must accept the send that follows.
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
  });

  it("repeats the same rule in the guarded UPDATE", () => {
    // The pre-check gives a clean error, but a delivery can be enqueued in the
    // gap before the write; the SQL has to refuse exactly the same statuses.
    assert.equal(EDIT_BLOCKING_STATUSES_PARAM, EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES);

    const condition = BILL_EDITABLE_SQL_CONDITION("$16");
    assert.match(condition, /\$16::text\[\]/, "statuses must be bound, not interpolated");
    assert.match(
      condition,
      /COALESCE\(whatsapp_metadata->>'status', 'no'\)/,
      "missing metadata must read as 'no' so legacy bills stay editable"
    );
    assert.doesNotMatch(condition, /'processing'/, "status literals must not be inlined into SQL");
  });

  describe("mark-delivered and mark-paid", () => {
    // Both endpoints rewrite advance/total_due, and both fields are printed on
    // the bill PDF, so they are bill changes and obey the same lock as the
    // normal update path.
    it("refuses a status change while a delivery is in flight", () => {
      assert.throws(
        () => assertBillEditableFromMetadata(processingMetadata()),
        (error) => {
          assert.ok(error instanceof BillEditBlockedError);
          assert.equal(error.statusCode, 409);
          assert.equal(error.code, "WHATSAPP_DELIVERY_IN_PROGRESS");
          assert.equal(error.deliveryStatus, WHATSAPP_DELIVERY_STATUS.PROCESSING);
          return true;
        }
      );
    });

    it("allows a status change from every settled status", () => {
      for (const metadata of [
        createInitialWhatsAppMetadata(),
        buildSuccessWhatsAppMetadata(processingMetadata(), { providerMessageId: "wamid.ok" }),
        buildFailedWhatsAppMetadata(processingMetadata(), new Error("provider rejected")),
        buildCanceledWhatsAppMetadata(processingMetadata()),
      ]) {
        assert.equal(assertBillEditableFromMetadata(metadata).allowed, true);
      }
    });

    it("reads a bill row's raw metadata, including the legacy shapes", () => {
      // These callers pass `bill.whatsapp_metadata` straight from the row, so
      // the guard has to cope with NULL, {} and a JSON string alike.
      assert.equal(assertBillEditableFromMetadata(null).allowed, true);
      assert.equal(assertBillEditableFromMetadata({}).allowed, true);
      assert.equal(
        assertBillEditableFromMetadata('{"status":"success"}').allowed,
        true
      );
      assert.throws(
        () => assertBillEditableFromMetadata('{"status":"processing"}'),
        BillEditBlockedError
      );
    });
  });
});
