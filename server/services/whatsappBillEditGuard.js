import { query } from "../utils/query.js";
import {
  BillNotFoundError,
  parseWhatsAppMetadata,
} from "./whatsappBillDeliveryErrors.js";
import {
  createInitialWhatsAppMetadata,
  evaluateBillEditEligibility,
  EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES,
} from "./whatsappBillMetadata.js";

export class BillEditBlockedError extends Error {
  constructor({ message, reason, status }) {
    super(message);
    this.name = "BillEditBlockedError";
    this.code = "WHATSAPP_DELIVERY_IN_PROGRESS";
    this.statusCode = 409;
    this.reason = reason;
    this.deliveryStatus = status;
  }
}

/**
 * Fallback for an update that matched no row for a reason the guard cannot
 * attribute to delivery state, so the original 400 stays intact.
 */
export class BillUpdateFailedError extends Error {
  constructor(message = "Error updating bill") {
    super(message);
    this.name = "BillUpdateFailedError";
    this.code = "BILL_UPDATE_FAILED";
    this.statusCode = 400;
  }
}

/**
 * Same rule as `assertBillEditableDuringWhatsAppDelivery`, for callers that
 * already hold the bill row and should not pay for a second SELECT.
 *
 * @throws {BillEditBlockedError}
 */
export function assertBillEditableFromMetadata(rawMetadata) {
  const metadata =
    parseWhatsAppMetadata(rawMetadata) || createInitialWhatsAppMetadata();

  const eligibility = evaluateBillEditEligibility(metadata);
  if (!eligibility.allowed) {
    throw new BillEditBlockedError(eligibility);
  }

  return eligibility;
}

/**
 * Statuses the update statement refuses to write over, passed as a bound
 * parameter so the SQL stays parameterized and cannot drift from the constant.
 */
export const EDIT_BLOCKING_STATUSES_PARAM = EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES;

/**
 * `WHERE` fragment that makes the guard atomic. The pre-check below gives the
 * operator a clean error before any bill item or stock row is touched, but a
 * delivery can still be enqueued in the gap between that read and the write, so
 * the same rule is repeated in the database.
 *
 * `COALESCE(..., 'no')` keeps bills created before the feature shipped editable.
 */
export const BILL_EDITABLE_SQL_CONDITION = (statusesParam) =>
  `COALESCE(whatsapp_metadata->>'status', 'no') <> ALL(${statusesParam}::text[])`;

async function readBillDeliveryMetadata({ billId, collectionId }) {
  const [bill] = await query(
    "SELECT whatsapp_metadata FROM orders WHERE order_id = $1 AND collection_id = $2",
    [billId, collectionId]
  );

  if (!bill) {
    return null;
  }

  return (
    parseWhatsAppMetadata(bill.whatsapp_metadata) || createInitialWhatsAppMetadata()
  );
}

/**
 * Blocks the normal update path while a WhatsApp delivery is in flight
 * (ADR 0005, PRD 29). Runs before any write so a locked bill never leaves
 * half-applied item or stock changes behind.
 *
 * @throws {BillNotFoundError|BillEditBlockedError}
 */
export async function assertBillEditableDuringWhatsAppDelivery({ billId, collectionId }) {
  const metadata = await readBillDeliveryMetadata({ billId, collectionId });

  if (!metadata) {
    throw new BillNotFoundError();
  }

  const eligibility = evaluateBillEditEligibility(metadata);
  if (!eligibility.allowed) {
    throw new BillEditBlockedError(eligibility);
  }

  return eligibility;
}

/**
 * Explains a guarded update that matched no row, using the state the bill is
 * actually in rather than a bare failure. Mirrors the cancel service's
 * lost-race handling so both guarded writes report the same way.
 */
export async function explainRejectedBillUpdate({
  billId,
  collectionId,
  fallbackMessage,
}) {
  const metadata = await readBillDeliveryMetadata({ billId, collectionId });

  if (!metadata) {
    return new BillNotFoundError();
  }

  const eligibility = evaluateBillEditEligibility(metadata);
  if (!eligibility.allowed) {
    return new BillEditBlockedError(eligibility);
  }

  return new BillUpdateFailedError(fallbackMessage);
}
