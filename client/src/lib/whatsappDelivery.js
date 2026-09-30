export const WHATSAPP_DELIVERY_STATUS = {
  NO: "no",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
  CANCELED: "canceled",
};

export const DEFAULT_POLL_INTERVAL_MS = 3000;
/**
 * Polling runs on every open bills view, so a mistyped env value like `10` would
 * turn the list into a hundred requests a second against the API.
 */
export const MIN_POLL_INTERVAL_MS = 1000;

export function getWhatsAppDeliveryPollIntervalMs(
  raw = import.meta.env?.VITE_WHATSAPP_DELIVERY_POLL_INTERVAL_MS
) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_POLL_INTERVAL_MS;
  }

  return Math.max(MIN_POLL_INTERVAL_MS, parsed);
}

export function parseWhatsAppMetadata(metadata) {
  if (!metadata) {
    return null;
  }

  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return null;
    }
  }

  return metadata;
}

export function getWhatsAppDeliveryStatus(billOrMetadata) {
  const metadata =
    billOrMetadata?.whatsapp_metadata !== undefined
      ? parseWhatsAppMetadata(billOrMetadata.whatsapp_metadata)
      : parseWhatsAppMetadata(billOrMetadata);

  return metadata?.status || WHATSAPP_DELIVERY_STATUS.NO;
}

export function getProcessingStartedAt(metadata) {
  const parsed = parseWhatsAppMetadata(metadata);
  if (!parsed) {
    return null;
  }

  return parsed.processing_started_at || parsed.delivery_requested_at || null;
}

export function getProcessingElapsedSeconds(startedAt, nowMs = Date.now()) {
  if (!startedAt) {
    return 0;
  }

  const startMs = new Date(startedAt).getTime();
  if (Number.isNaN(startMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

export function formatWhatsAppDeliveryStatusLabel(status, elapsedSeconds = 0) {
  switch (status) {
    case WHATSAPP_DELIVERY_STATUS.PROCESSING:
      return `processing(${elapsedSeconds}s)`;
    case WHATSAPP_DELIVERY_STATUS.SUCCESS:
      return "success";
    case WHATSAPP_DELIVERY_STATUS.FAILED:
      return "failed";
    case WHATSAPP_DELIVERY_STATUS.CANCELED:
      return "canceled";
    case WHATSAPP_DELIVERY_STATUS.NO:
    default:
      return "no";
  }
}

/**
 * How long `processing` may run before the UI treats it as stuck.
 *
 * A delivery takes seconds. Minutes means the worker is down, Redis is
 * unreachable, or the provider is hanging — none of which the bill can report on
 * its own, because the status only changes when a worker writes to it. Without
 * this the operator watches a counter climb with no hint that force cancel is
 * the way out (PRD 19, ADR 0006).
 */
export const PROCESSING_STALL_SECONDS = 120;

export function isProcessingStalled(status, elapsedSeconds) {
  return (
    status === WHATSAPP_DELIVERY_STATUS.PROCESSING &&
    elapsedSeconds >= PROCESSING_STALL_SECONDS
  );
}

export const PROCESSING_STALL_REASON =
  "This delivery has been running unusually long. The delivery worker may be stopped. Force cancel it to unlock the bill and try again.";

export function getWhatsAppDeliveryStatusColor(status, { stalled = false } = {}) {
  switch (status) {
    case WHATSAPP_DELIVERY_STATUS.PROCESSING:
      return stalled ? "amber" : "indigo";
    case WHATSAPP_DELIVERY_STATUS.SUCCESS:
      return "green";
    case WHATSAPP_DELIVERY_STATUS.FAILED:
      return "red";
    case WHATSAPP_DELIVERY_STATUS.CANCELED:
      return "amber";
    case WHATSAPP_DELIVERY_STATUS.NO:
    default:
      return "gray";
  }
}

export function billHasProcessingWhatsAppDelivery(bills) {
  return (
    Array.isArray(bills) &&
    bills.some(
      (bill) =>
        getWhatsAppDeliveryStatus(bill) === WHATSAPP_DELIVERY_STATUS.PROCESSING
    )
  );
}

/**
 * Statuses a bill can be resent from. Mirrors
 * server/services/whatsappBillMetadata.js -> RESENDABLE_WHATSAPP_DELIVERY_STATUSES.
 * The backend is still the source of truth; this only drives affordances.
 */
export const RESENDABLE_WHATSAPP_DELIVERY_STATUSES = [
  WHATSAPP_DELIVERY_STATUS.NO,
  WHATSAPP_DELIVERY_STATUS.SUCCESS,
  WHATSAPP_DELIVERY_STATUS.FAILED,
  WHATSAPP_DELIVERY_STATUS.CANCELED,
];

export function canResendWhatsAppDelivery(statusOrBill) {
  const status =
    typeof statusOrBill === "string"
      ? statusOrBill
      : getWhatsAppDeliveryStatus(statusOrBill);

  return RESENDABLE_WHATSAPP_DELIVERY_STATUSES.includes(status);
}

/**
 * Statuses a bill can be force-canceled from. Mirrors
 * server/services/whatsappBillMetadata.js -> CANCELABLE_WHATSAPP_DELIVERY_STATUSES.
 */
export const CANCELABLE_WHATSAPP_DELIVERY_STATUSES = [
  WHATSAPP_DELIVERY_STATUS.PROCESSING,
];

export function canCancelWhatsAppDelivery(statusOrBill) {
  const status =
    typeof statusOrBill === "string"
      ? statusOrBill
      : getWhatsAppDeliveryStatus(statusOrBill);

  return CANCELABLE_WHATSAPP_DELIVERY_STATUSES.includes(status);
}

/**
 * Statuses that lock a bill against normal editing. Mirrors
 * server/services/whatsappBillMetadata.js -> EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES.
 * The backend re-checks this on every update; the lock here only explains why.
 */
export const EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES = [
  WHATSAPP_DELIVERY_STATUS.PROCESSING,
];

export function isBillLockedForEditing(statusOrBill) {
  const status =
    typeof statusOrBill === "string"
      ? statusOrBill
      : getWhatsAppDeliveryStatus(statusOrBill);

  return EDIT_BLOCKING_WHATSAPP_DELIVERY_STATUSES.includes(status);
}

export const EDIT_LOCK_REASON =
  "This bill is locked while its WhatsApp delivery is in progress. Force cancel the delivery to edit it.";

export function getResendActionLabel(statusOrBill) {
  const status =
    typeof statusOrBill === "string"
      ? statusOrBill
      : getWhatsAppDeliveryStatus(statusOrBill);

  return status === WHATSAPP_DELIVERY_STATUS.NO ? "Send on WhatsApp" : "Resend on WhatsApp";
}

export function shouldPollWhatsAppDeliveryStatus(statusOrBill) {
  const status =
    typeof statusOrBill === "string"
      ? statusOrBill
      : getWhatsAppDeliveryStatus(statusOrBill);

  return status === WHATSAPP_DELIVERY_STATUS.PROCESSING;
}
