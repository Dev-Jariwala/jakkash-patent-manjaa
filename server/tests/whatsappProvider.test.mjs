import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import {
  describeWhatsAppProviderConfig,
  getWhatsAppProviderConfig,
  normalizeDeliveryError,
  normalizeWhatsAppRecipient,
  sendBillDocumentOnWhatsApp,
  WhatsAppConfigError,
  WhatsAppProviderError,
} from "../services/whatsappProvider.js";
import { createBill } from "./helpers/fixtures.mjs";

const PROVIDER_ENV = {
  WHATSAPP_TOKEN: "test-token",
  WHATSAPP_PHONE_NUMBER_ID: "1234567890",
  WHATSAPP_TEMPLATE_NAME: "jakkash_bill_delivery",
  WHATSAPP_TEMPLATE_LANGUAGE: "en",
  WHATSAPP_API_VERSION: "v21.0",
  WHATSAPP_DEFAULT_COUNTRY_CODE: "91",
};

const MANAGED_ENV_KEYS = [...Object.keys(PROVIDER_ENV), "id", "WHATSAPP_REQUEST_TIMEOUT_MS"];

let savedEnv;

function jsonResponse(payload, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => payload };
}

/** Records each call and replies with the queued responses in order. */
function createFetchStub(responses) {
  const calls = [];
  const queue = [...responses];

  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (typeof next === "function") {
      return next();
    }
    return next;
  };

  fetchImpl.calls = calls;
  return fetchImpl;
}

beforeEach(() => {
  savedEnv = Object.fromEntries(MANAGED_ENV_KEYS.map((key) => [key, process.env[key]]));
  Object.assign(process.env, PROVIDER_ENV);
  delete process.env.id;
  delete process.env.WHATSAPP_REQUEST_TIMEOUT_MS;
});

afterEach(() => {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("WhatsApp recipient normalization", () => {
  it("adds the configured country code to a national number", () => {
    assert.equal(normalizeWhatsAppRecipient("9876543210"), "919876543210");
    assert.equal(normalizeWhatsAppRecipient("98765 43210"), "919876543210");
    assert.equal(normalizeWhatsAppRecipient("+91 98765-43210"), "919876543210");
  });

  it("drops the national trunk prefix before adding the country code", () => {
    assert.equal(normalizeWhatsAppRecipient("09876543210"), "919876543210");
  });

  it("keeps a number that is already international", () => {
    assert.equal(normalizeWhatsAppRecipient("919876543210"), "919876543210");
    assert.equal(normalizeWhatsAppRecipient("00919876543210"), "919876543210");
    assert.equal(normalizeWhatsAppRecipient("14155552671"), "14155552671");
  });

  it("honours a different default country code", () => {
    assert.equal(normalizeWhatsAppRecipient("5551234567", { countryCode: "1" }), "15551234567");
  });

  it("rejects anything that is not a plausible number", () => {
    // A malformed number would be delivered to whoever does own it, and the
    // bill would record a successful delivery to the wrong person.
    for (const invalid of ["", null, undefined, "abc", "12345", "9876543", "0009876543210"]) {
      assert.throws(
        () => normalizeWhatsAppRecipient(invalid),
        (error) => {
          assert.ok(error instanceof WhatsAppProviderError);
          assert.equal(error.code, "WHATSAPP_INVALID_RECIPIENT");
          return true;
        },
        `expected "${invalid}" to be rejected`
      );
    }
  });

  it("rejects a number longer than E.164 allows", () => {
    assert.throws(() => normalizeWhatsAppRecipient("9198765432101234"), /not a valid WhatsApp recipient/);
  });
});

describe("WhatsApp provider configuration", () => {
  it("reports every missing credential at once", () => {
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_TEMPLATE_NAME;

    const { configured, missing } = describeWhatsAppProviderConfig();

    assert.equal(configured, false);
    assert.deepEqual(missing.sort(), ["WHATSAPP_TEMPLATE_NAME", "WHATSAPP_TOKEN"]);
  });

  it("reports a fully configured provider as ready", () => {
    assert.deepEqual(describeWhatsAppProviderConfig(), { configured: true, missing: [] });
  });

  it("accepts the legacy phone-number-id variable", () => {
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    process.env.id = "legacy-id";

    assert.equal(describeWhatsAppProviderConfig().configured, true);
    assert.equal(getWhatsAppProviderConfig().phoneNumberId, "legacy-id");
  });

  it("fails loudly rather than sending with a missing credential", () => {
    delete process.env.WHATSAPP_TOKEN;

    assert.throws(() => getWhatsAppProviderConfig(), (error) => {
      assert.ok(error instanceof WhatsAppConfigError);
      assert.equal(error.code, "WHATSAPP_CONFIG_ERROR");
      return true;
    });
  });
});

describe("sending a bill document", () => {
  it("uploads the document, then sends the template referencing it", async () => {
    const fetchImpl = createFetchStub([
      jsonResponse({ id: "media-1" }),
      jsonResponse({ messages: [{ id: "wamid.sent" }] }),
    ]);

    const { providerMessageId } = await sendBillDocumentOnWhatsApp({
      pdfBuffer: Buffer.from("%PDF-1.7"),
      filename: "Jakkash-Bill-101.pdf",
      bill: createBill(),
      fetchImpl,
    });

    assert.equal(providerMessageId, "wamid.sent");
    assert.equal(fetchImpl.calls.length, 2);

    const [upload, send] = fetchImpl.calls;
    assert.match(upload.url, /\/v21\.0\/1234567890\/media$/);
    assert.match(send.url, /\/v21\.0\/1234567890\/messages$/);
    assert.equal(send.init.headers.Authorization, "Bearer test-token");

    const payload = JSON.parse(send.init.body);
    assert.equal(payload.to, "919876543210");
    assert.equal(payload.type, "template");
    assert.equal(payload.template.name, "jakkash_bill_delivery");
    assert.equal(payload.template.language.code, "en");
  });

  it("attaches the bill as the template's document header", async () => {
    // The single bill delivery template carries the PDF in its header; a body
    // parameter mismatch is what makes Meta reject the send.
    const fetchImpl = createFetchStub([
      jsonResponse({ id: "media-1" }),
      jsonResponse({ messages: [{ id: "wamid.sent" }] }),
    ]);

    await sendBillDocumentOnWhatsApp({
      pdfBuffer: Buffer.from("%PDF-1.7"),
      filename: "Jakkash-Bill-101.pdf",
      bill: createBill({ name: "Test Client", bill_no: 101 }),
      fetchImpl,
    });

    const { components } = JSON.parse(fetchImpl.calls[1].init.body).template;
    const header = components.find((component) => component.type === "header");
    const body = components.find((component) => component.type === "body");

    assert.equal(header.parameters[0].document.id, "media-1");
    assert.equal(header.parameters[0].document.filename, "Jakkash-Bill-101.pdf");
    assert.deepEqual(
      body.parameters.map((parameter) => parameter.text),
      ["Test Client", "101"]
    );
  });

  it("never calls the provider for an unusable number", async () => {
    const fetchImpl = createFetchStub([]);

    await assert.rejects(
      () =>
        sendBillDocumentOnWhatsApp({
          pdfBuffer: Buffer.from("%PDF-1.7"),
          filename: "bill.pdf",
          bill: createBill({ mobile: "" }),
          fetchImpl,
        }),
      /mobile number is missing/
    );
    assert.equal(fetchImpl.calls.length, 0);
  });

  it("turns a provider rejection into a readable delivery error", async () => {
    const fetchImpl = createFetchStub([
      jsonResponse(
        { error: { message: "Template does not exist", code: 132001, type: "OAuthException" } },
        { ok: false, status: 400 }
      ),
    ]);

    await assert.rejects(
      () =>
        sendBillDocumentOnWhatsApp({
          pdfBuffer: Buffer.from("%PDF-1.7"),
          filename: "bill.pdf",
          bill: createBill(),
          fetchImpl,
        }),
      (error) => {
        // This message is what the operator reads on the failed status chip.
        assert.equal(error.message, "Template does not exist");
        assert.equal(error.code, "WHATSAPP_API_ERROR");
        assert.equal(error.providerCode, 132001);
        return true;
      }
    );
  });

  it("fails when the provider accepts the call but returns no message id", async () => {
    // Without an id there is nothing to reconcile against, so this cannot be
    // reported as a success.
    const fetchImpl = createFetchStub([
      jsonResponse({ id: "media-1" }),
      jsonResponse({ messages: [] }),
    ]);

    await assert.rejects(
      () =>
        sendBillDocumentOnWhatsApp({
          pdfBuffer: Buffer.from("%PDF-1.7"),
          filename: "bill.pdf",
          bill: createBill(),
          fetchImpl,
        }),
      (error) => {
        assert.equal(error.code, "WHATSAPP_TEMPLATE_SEND_FAILED");
        return true;
      }
    );
  });

  it("gives up on a provider that never responds", async () => {
    // A hung request would otherwise hold its worker slot forever and leave the
    // bill stuck in `processing` with no way out but a force cancel.
    process.env.WHATSAPP_REQUEST_TIMEOUT_MS = "20";
    const fetchImpl = async (url, init) =>
      new Promise((resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(init.signal.reason));
      });

    await assert.rejects(
      () =>
        sendBillDocumentOnWhatsApp({
          pdfBuffer: Buffer.from("%PDF-1.7"),
          filename: "bill.pdf",
          bill: createBill(),
          fetchImpl,
        }),
      (error) => {
        assert.equal(error.code, "WHATSAPP_API_TIMEOUT");
        return true;
      }
    );
  });
});

describe("delivery error normalization", () => {
  it("passes provider and config errors through untouched", () => {
    const providerError = new WhatsAppProviderError("nope", { code: "WHATSAPP_API_ERROR" });
    const configError = new WhatsAppConfigError("missing");

    assert.equal(normalizeDeliveryError(providerError), providerError);
    assert.equal(normalizeDeliveryError(configError), configError);
  });

  it("wraps anything else so the bill records a usable reason", () => {
    const normalized = normalizeDeliveryError(new Error("socket hang up"));

    assert.ok(normalized instanceof WhatsAppProviderError);
    assert.equal(normalized.message, "socket hang up");
    assert.equal(normalized.code, "WHATSAPP_DELIVERY_FAILED");
  });
});
