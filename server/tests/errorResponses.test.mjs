import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { handleError } from "../utils/error.js";
import { WhatsAppServiceDisabledError } from "../services/whatsappServiceSetting.js";
import { WhatsAppResendNotAllowedError } from "../services/whatsappBillDeliveryResend.js";
import { WhatsAppCancelNotAllowedError } from "../services/whatsappBillDeliveryCancel.js";
import {
  BillEditBlockedError,
  BillUpdateFailedError,
} from "../services/whatsappBillEditGuard.js";
import { BillNotFoundError } from "../services/whatsappBillDeliveryErrors.js";
import {
  evaluateBillEditEligibility,
  evaluateWhatsAppCancelEligibility,
  evaluateWhatsAppResendEligibility,
  createInitialWhatsAppMetadata,
} from "../services/whatsappBillMetadata.js";
import { createMockResponse, processingMetadata } from "./helpers/fixtures.mjs";

/**
 * The delivery UX is driven by these response shapes: the resend action swaps to
 * the "service is off" explanation on `WHATSAPP_SERVICE_DISABLED`, and the bill
 * form keeps its edit lock on `WHATSAPP_DELIVERY_IN_PROGRESS`. A handler that
 * flattened these to 500 would silently degrade all of it to a generic toast.
 */
describe("error responses", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("surfaces each delivery error with the status and code the UI switches on", () => {
    const cases = [
      [new WhatsAppServiceDisabledError(), 403, "WHATSAPP_SERVICE_DISABLED"],
      [
        new WhatsAppResendNotAllowedError(
          evaluateWhatsAppResendEligibility(processingMetadata())
        ),
        409,
        "WHATSAPP_RESEND_NOT_ALLOWED",
      ],
      [
        new WhatsAppCancelNotAllowedError(
          evaluateWhatsAppCancelEligibility(createInitialWhatsAppMetadata())
        ),
        409,
        "WHATSAPP_CANCEL_NOT_ALLOWED",
      ],
      [
        new BillEditBlockedError(evaluateBillEditEligibility(processingMetadata())),
        409,
        "WHATSAPP_DELIVERY_IN_PROGRESS",
      ],
      [new BillNotFoundError(), 404, "BILL_NOT_FOUND"],
      [new BillUpdateFailedError(), 400, "BILL_UPDATE_FAILED"],
    ];

    for (const [error, expectedStatus, expectedCode] of cases) {
      const res = createMockResponse();
      handleError("test", res, error);

      assert.equal(res.statusCode, expectedStatus, `${error.name} status`);
      assert.equal(res.body.code, expectedCode, `${error.name} code`);
      assert.equal(res.body.success, false);
    }
  });

  it("keeps the operator-facing explanation on a refused action", () => {
    const res = createMockResponse();
    const eligibility = evaluateWhatsAppResendEligibility(processingMetadata());

    handleError("resendBillWhatsAppDelivery", res, new WhatsAppResendNotAllowedError(eligibility));

    assert.match(res.body.message, /in progress/i);
    assert.match(res.body.message, /force cancel/i);
  });

  it("defaults an unclassified failure to 500", () => {
    const res = createMockResponse();

    handleError("test", res, new Error("Something broke"));

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.code, "INTERNAL_SERVER_ERROR");
  });

  it("does not leak internal failure detail in production", () => {
    // A driver message can carry a query fragment or a host name; the operator
    // has nothing to do with it and the client should not receive it.
    process.env.NODE_ENV = "production";
    const res = createMockResponse();

    handleError("test", res, new Error('relation "bills" does not exist'));

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, "Internal server error");
    assert.equal(res.body.error, undefined);
  });

  it("still explains a deliberate refusal in production", () => {
    process.env.NODE_ENV = "production";
    const res = createMockResponse();

    handleError("test", res, new WhatsAppServiceDisabledError());

    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /disabled/i);
  });
});
