const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_TEMPLATE_LANGUAGE = "en";
const DEFAULT_COUNTRY_CODE = "91";
/**
 * A provider call that never returns would hold its worker slot forever, and
 * with no automatic retries (PRD) a stuck job blocks the operator from resending
 * until they force-cancel. Bounding the request turns that into an ordinary
 * `failed` outcome they can act on.
 */
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

export class WhatsAppProviderError extends Error {
  constructor(message, { code, providerCode, providerType, details } = {}) {
    super(message);
    this.name = "WhatsAppProviderError";
    this.code = code || "WHATSAPP_PROVIDER_ERROR";
    this.providerCode = providerCode ?? null;
    this.providerType = providerType ?? null;
    this.details = details ?? null;
  }
}

export class WhatsAppConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "WhatsAppConfigError";
    this.code = "WHATSAPP_CONFIG_ERROR";
  }
}

function readRequiredEnv(name, { fallbackNames = [] } = {}) {
  const names = [name, ...fallbackNames];
  for (const key of names) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      return value;
    }
  }
  throw new WhatsAppConfigError(`Missing required environment variable: ${name}`);
}

export function getWhatsAppProviderConfig() {
  return {
    token: readRequiredEnv("WHATSAPP_TOKEN"),
    phoneNumberId: readRequiredEnv("WHATSAPP_PHONE_NUMBER_ID", { fallbackNames: ["id"] }),
    templateName: readRequiredEnv("WHATSAPP_TEMPLATE_NAME"),
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE || DEFAULT_TEMPLATE_LANGUAGE,
    apiVersion: process.env.WHATSAPP_API_VERSION || DEFAULT_API_VERSION,
    countryCode: process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || DEFAULT_COUNTRY_CODE,
    requestTimeoutMs:
      Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS) > 0
        ? Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS)
        : DEFAULT_REQUEST_TIMEOUT_MS,
  };
}

/**
 * Non-throwing config probe for startup diagnostics.
 *
 * Provider credentials are only read per job, so a worker booted without them
 * looks healthy and then fails every delivery with a config error. This lets the
 * worker say so once, at boot, instead of once per bill.
 *
 * @returns {{configured: boolean, missing: string[]}}
 */
export function describeWhatsAppProviderConfig() {
  const missing = [];
  try {
    getWhatsAppProviderConfig();
  } catch (error) {
    if (!(error instanceof WhatsAppConfigError)) {
      throw error;
    }
    // `readRequiredEnv` reports the first gap it hits, so collect the rest by
    // checking the required names directly.
    for (const [name, present] of [
      ["WHATSAPP_TOKEN", Boolean(process.env.WHATSAPP_TOKEN)],
      [
        "WHATSAPP_PHONE_NUMBER_ID",
        Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.id),
      ],
      ["WHATSAPP_TEMPLATE_NAME", Boolean(process.env.WHATSAPP_TEMPLATE_NAME)],
    ]) {
      if (!present) {
        missing.push(name);
      }
    }
  }

  return { configured: missing.length === 0, missing };
}

/** E.164 caps a subscriber number at 15 digits including the country code. */
const MAX_E164_DIGITS = 15;
/** Shortest country code plus subscriber number worth attempting. */
const MIN_INTERNATIONAL_DIGITS = 11;
const NATIONAL_NUMBER_DIGITS = 10;

/**
 * Turns a stored bill mobile into the digits-only international form the Graph
 * API expects.
 *
 * Anything that cannot be resolved to a plausible E.164 number is rejected here
 * rather than handed to the provider: a malformed number would otherwise be
 * delivered to whoever does own it, and the bill would be recorded as a
 * successful delivery to the wrong person.
 */
export function normalizeWhatsAppRecipient(mobile, { countryCode = DEFAULT_COUNTRY_CODE } = {}) {
  const rawDigits = String(mobile ?? "").replace(/\D/g, "");

  if (!rawDigits) {
    throw new WhatsAppProviderError("Bill mobile number is missing", {
      code: "WHATSAPP_INVALID_RECIPIENT",
    });
  }

  const reject = () => {
    throw new WhatsAppProviderError(
      `Bill mobile number "${mobile}" is not a valid WhatsApp recipient`,
      { code: "WHATSAPP_INVALID_RECIPIENT" }
    );
  };

  // `00` is the international access prefix; what follows is already E.164
  // digits, so a trunk zero there means the number is malformed, not national.
  const isInternationalForm = rawDigits.startsWith("00");
  let digits = isInternationalForm ? rawDigits.slice(2) : rawDigits;

  // A single leading zero on a national number is the trunk prefix, not part of
  // the number.
  if (
    !isInternationalForm &&
    digits.length === NATIONAL_NUMBER_DIGITS + 1 &&
    digits.startsWith("0")
  ) {
    digits = digits.slice(1);
  }

  if (digits.startsWith("0") || digits.length > MAX_E164_DIGITS) {
    reject();
  }

  if (digits.length === NATIONAL_NUMBER_DIGITS) {
    return `${countryCode}${digits}`;
  }

  if (digits.length >= MIN_INTERNATIONAL_DIGITS) {
    return digits;
  }

  return reject();
}

async function parseProviderResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const providerError = payload?.error;
    throw new WhatsAppProviderError(
      providerError?.message || `WhatsApp API request failed with status ${response.status}`,
      {
        code: "WHATSAPP_API_ERROR",
        providerCode: providerError?.code ?? null,
        providerType: providerError?.type ?? null,
        details: providerError ?? payload,
      }
    );
  }

  return payload;
}

function buildGraphApiUrl(config, path) {
  return `https://graph.facebook.com/${config.apiVersion}/${path}`;
}

function buildTemplateBodyParameters(bill) {
  return [
    { type: "text", text: String(bill?.name ?? "Customer") },
    { type: "text", text: String(bill?.order_no ?? bill?.bill_no ?? "") },
  ];
}

/**
 * Single place the provider is actually called from, so the timeout and the
 * abort-to-provider-error translation cannot drift between the two endpoints.
 * `fetchImpl` is injected only by tests; production always uses global `fetch`.
 */
async function callGraphApi(url, init, { config, fetchImpl = fetch }) {
  try {
    return await fetchImpl(url, {
      ...init,
      signal: AbortSignal.timeout(config.requestTimeoutMs),
    });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new WhatsAppProviderError(
        `WhatsApp API request timed out after ${config.requestTimeoutMs}ms`,
        { code: "WHATSAPP_API_TIMEOUT" }
      );
    }
    throw error;
  }
}

export async function uploadWhatsAppDocumentMedia({ buffer, filename, fetchImpl }) {
  const config = getWhatsAppProviderConfig();
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("type", "application/pdf");
  formData.append("file", new Blob([buffer], { type: "application/pdf" }), filename);

  const response = await callGraphApi(
    buildGraphApiUrl(config, `${config.phoneNumberId}/media`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      body: formData,
    },
    { config, fetchImpl }
  );

  const payload = await parseProviderResponse(response);
  const mediaId = payload?.id;

  if (!mediaId) {
    throw new WhatsAppProviderError("WhatsApp media upload did not return a media id", {
      code: "WHATSAPP_MEDIA_UPLOAD_FAILED",
      details: payload,
    });
  }

  return { mediaId };
}

export async function sendWhatsAppBillTemplate({ to, mediaId, filename, bill, fetchImpl }) {
  const config = getWhatsAppProviderConfig();
  const bodyParameters = buildTemplateBodyParameters(bill);

  const response = await callGraphApi(
    buildGraphApiUrl(config, `${config.phoneNumberId}/messages`),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "document",
                  document: {
                    id: mediaId,
                    filename,
                  },
                },
              ],
            },
            {
              type: "body",
              parameters: bodyParameters,
            },
          ],
        },
      }),
    },
    { config, fetchImpl }
  );

  const payload = await parseProviderResponse(response);
  const providerMessageId = payload?.messages?.[0]?.id ?? null;

  if (!providerMessageId) {
    throw new WhatsAppProviderError("WhatsApp template send did not return a message id", {
      code: "WHATSAPP_TEMPLATE_SEND_FAILED",
      details: payload,
    });
  }

  return { providerMessageId, providerResponse: payload };
}

export async function sendBillDocumentOnWhatsApp({ pdfBuffer, filename, bill, fetchImpl }) {
  const config = getWhatsAppProviderConfig();
  const to = normalizeWhatsAppRecipient(bill?.mobile, { countryCode: config.countryCode });
  const { mediaId } = await uploadWhatsAppDocumentMedia({
    buffer: pdfBuffer,
    filename,
    fetchImpl,
  });
  return sendWhatsAppBillTemplate({ to, mediaId, filename, bill, fetchImpl });
}

export function normalizeDeliveryError(error) {
  if (error instanceof WhatsAppProviderError || error instanceof WhatsAppConfigError) {
    return error;
  }

  return new WhatsAppProviderError(error?.message || "WhatsApp delivery failed", {
    code: error?.code || "WHATSAPP_DELIVERY_FAILED",
    details: error,
  });
}
