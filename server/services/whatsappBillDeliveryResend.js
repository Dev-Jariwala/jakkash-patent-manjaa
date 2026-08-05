import { query } from "../utils/query.js";
import { assertWhatsAppServiceEnabled } from "./whatsappServiceSetting.js";
import { enqueueBillWhatsAppDelivery } from "./whatsappBillDeliveryEnqueue.js";
import {
  createInitialWhatsAppMetadata,
  evaluateWhatsAppResendEligibility,
} from "./whatsappBillMetadata.js";

export class WhatsAppResendNotAllowedError extends Error {
  constructor({ message, reason, status }) {
    super(message);
    this.name = "WhatsAppResendNotAllowedError";
    this.code = "WHATSAPP_RESEND_NOT_ALLOWED";
    this.statusCode = 409;
    this.reason = reason;
    this.deliveryStatus = status;
  }
}

export class BillNotFoundError extends Error {
  constructor() {
    super("Bill not found");
    this.name = "BillNotFoundError";
    this.code = "BILL_NOT_FOUND";
    this.statusCode = 404;
  }
}

function parseWhatsAppMetadata(rawMetadata) {
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

/**
 * Dedicated resend action, kept separate from bill editing (ADR 0002).
 * Enforcement order matters: the service toggle is checked before status
 * eligibility so a disabled service always produces the same operator-facing
 * explanation regardless of the bill's current delivery state.
 */
export async function resendBillWhatsAppDelivery({ billId, collectionId }) {
  await assertWhatsAppServiceEnabled();

  const [bill] = await query(
    "SELECT * FROM bills WHERE bill_id = $1 AND collection_id = $2",
    [billId, collectionId]
  );

  if (!bill) {
    throw new BillNotFoundError();
  }

  // Bills created before the feature shipped can have an empty column; treat
  // them as a never-requested delivery rather than rejecting the resend.
  const metadata =
    parseWhatsAppMetadata(bill.whatsapp_metadata) || createInitialWhatsAppMetadata();

  const eligibility = evaluateWhatsAppResendEligibility(metadata);
  if (!eligibility.allowed) {
    throw new WhatsAppResendNotAllowedError(eligibility);
  }

  const { bill: billWithProcessingState } = await enqueueBillWhatsAppDelivery({
    billId,
    collectionId,
    whatsappMetadata: metadata,
    resetRequestedAt: true,
  });

  return billWithProcessingState;
}
