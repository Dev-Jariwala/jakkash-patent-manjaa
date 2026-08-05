/**
 * Errors shared by the WhatsApp bill delivery action services (resend, cancel).
 * They carry `statusCode`/`code` so `handleError` can surface them verbatim.
 */

export class BillNotFoundError extends Error {
  constructor() {
    super("Bill not found");
    this.name = "BillNotFoundError";
    this.code = "BILL_NOT_FOUND";
    this.statusCode = 404;
  }
}

export function parseWhatsAppMetadata(rawMetadata) {
  if (!rawMetadata) {
    return null;
  }

  if (typeof rawMetadata === "string") {
    try {
      return JSON.parse(rawMetadata);
    } catch {
      return null;
    }
  }

  return rawMetadata;
}
