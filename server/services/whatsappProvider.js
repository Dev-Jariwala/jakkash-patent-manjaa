const DEFAULT_API_VERSION = "v21.0";
const DEFAULT_TEMPLATE_LANGUAGE = "en";
const DEFAULT_COUNTRY_CODE = "91";

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
  };
}

export function normalizeWhatsAppRecipient(mobile, { countryCode = DEFAULT_COUNTRY_CODE } = {}) {
  const digits = String(mobile ?? "").replace(/\D/g, "");

  if (!digits) {
    throw new WhatsAppProviderError("Bill mobile number is missing", {
      code: "WHATSAPP_INVALID_RECIPIENT",
    });
  }

  if (digits.length === 10) {
    return `${countryCode}${digits}`;
  }

  if (digits.length === 12 && digits.startsWith(countryCode)) {
    return digits;
  }

  if (digits.length > 10) {
    return digits;
  }

  throw new WhatsAppProviderError("Bill mobile number is not a valid WhatsApp recipient", {
    code: "WHATSAPP_INVALID_RECIPIENT",
  });
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
    { type: "text", text: String(bill?.bill_no ?? "") },
  ];
}

export async function uploadWhatsAppDocumentMedia({ buffer, filename }) {
  const config = getWhatsAppProviderConfig();
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("type", "application/pdf");
  formData.append("file", new Blob([buffer], { type: "application/pdf" }), filename);

  const response = await fetch(buildGraphApiUrl(config, `${config.phoneNumberId}/media`), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
    body: formData,
  });

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

export async function sendWhatsAppBillTemplate({ to, mediaId, filename, bill }) {
  const config = getWhatsAppProviderConfig();
  const bodyParameters = buildTemplateBodyParameters(bill);

  const response = await fetch(buildGraphApiUrl(config, `${config.phoneNumberId}/messages`), {
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
  });

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

export async function sendBillDocumentOnWhatsApp({ pdfBuffer, filename, bill }) {
  const config = getWhatsAppProviderConfig();
  const to = normalizeWhatsAppRecipient(bill?.mobile, { countryCode: config.countryCode });
  const { mediaId } = await uploadWhatsAppDocumentMedia({ buffer: pdfBuffer, filename });
  return sendWhatsAppBillTemplate({ to, mediaId, filename, bill });
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
