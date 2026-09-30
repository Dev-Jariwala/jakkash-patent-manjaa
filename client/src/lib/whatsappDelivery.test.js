import { describe, expect, it } from "vitest";

import {
  canCancelWhatsAppDelivery,
  canResendWhatsAppDelivery,
  DEFAULT_POLL_INTERVAL_MS,
  formatWhatsAppDeliveryStatusLabel,
  getProcessingElapsedSeconds,
  getProcessingStartedAt,
  getResendActionLabel,
  getWhatsAppDeliveryPollIntervalMs,
  getWhatsAppDeliveryStatus,
  getWhatsAppDeliveryStatusColor,
  isBillLockedForEditing,
  isProcessingStalled,
  MIN_POLL_INTERVAL_MS,
  parseWhatsAppMetadata,
  PROCESSING_STALL_SECONDS,
  billHasProcessingWhatsAppDelivery,
  shouldPollWhatsAppDeliveryStatus,
  WHATSAPP_DELIVERY_STATUS,
} from "@/lib/whatsappDelivery";

const SETTLED_STATUSES = [
  WHATSAPP_DELIVERY_STATUS.NO,
  WHATSAPP_DELIVERY_STATUS.SUCCESS,
  WHATSAPP_DELIVERY_STATUS.FAILED,
  WHATSAPP_DELIVERY_STATUS.CANCELED,
];

describe("reading delivery state off a bill", () => {
  it("reads the status from a bill, from metadata, or from a JSON string", () => {
    // The column arrives parsed from most endpoints and as text from some.
    expect(getWhatsAppDeliveryStatus({ whatsapp_metadata: { status: "success" } })).toBe(
      "success"
    );
    expect(getWhatsAppDeliveryStatus({ status: "failed" })).toBe("failed");
    expect(getWhatsAppDeliveryStatus({ whatsapp_metadata: '{"status":"processing"}' })).toBe(
      "processing"
    );
  });

  it("treats a bill from before the feature as never sent", () => {
    expect(getWhatsAppDeliveryStatus({})).toBe(WHATSAPP_DELIVERY_STATUS.NO);
    expect(getWhatsAppDeliveryStatus(null)).toBe(WHATSAPP_DELIVERY_STATUS.NO);
    expect(parseWhatsAppMetadata("not json")).toBeNull();
  });

  it("falls back to the request time when processing has no start stamp", () => {
    expect(
      getProcessingStartedAt({
        processing_started_at: null,
        delivery_requested_at: "2026-01-01T00:00:00.000Z",
      })
    ).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("processing timer", () => {
  it("counts the seconds since the delivery started", () => {
    const startedAt = "2026-01-01T00:00:00.000Z";
    const now = new Date("2026-01-01T00:00:30.000Z").getTime();

    expect(getProcessingElapsedSeconds(startedAt, now)).toBe(30);
    expect(formatWhatsAppDeliveryStatusLabel(WHATSAPP_DELIVERY_STATUS.PROCESSING, 30)).toBe(
      "processing(30s)"
    );
  });

  it("never shows a negative timer when the clocks disagree", () => {
    // The stamp is the server's; the clock is the operator's browser.
    const startedAt = "2026-01-01T00:01:00.000Z";
    const now = new Date("2026-01-01T00:00:00.000Z").getTime();

    expect(getProcessingElapsedSeconds(startedAt, now)).toBe(0);
    expect(getProcessingElapsedSeconds(null)).toBe(0);
    expect(getProcessingElapsedSeconds("not a date")).toBe(0);
  });

  it("flags a delivery that has been running far too long", () => {
    // Nothing else can tell the operator the worker is down: the status only
    // changes when a worker writes to the bill.
    expect(
      isProcessingStalled(WHATSAPP_DELIVERY_STATUS.PROCESSING, PROCESSING_STALL_SECONDS)
    ).toBe(true);
    expect(
      isProcessingStalled(WHATSAPP_DELIVERY_STATUS.PROCESSING, PROCESSING_STALL_SECONDS - 1)
    ).toBe(false);
    expect(isProcessingStalled(WHATSAPP_DELIVERY_STATUS.SUCCESS, 9999)).toBe(false);
  });

  it("warns through the chip colour once a delivery looks stuck", () => {
    expect(getWhatsAppDeliveryStatusColor(WHATSAPP_DELIVERY_STATUS.PROCESSING)).toBe("indigo");
    expect(
      getWhatsAppDeliveryStatusColor(WHATSAPP_DELIVERY_STATUS.PROCESSING, { stalled: true })
    ).toBe("amber");
  });
});

describe("status labels", () => {
  it("uses the exact status words the operator was promised", () => {
    expect(formatWhatsAppDeliveryStatusLabel(WHATSAPP_DELIVERY_STATUS.NO)).toBe("no");
    expect(formatWhatsAppDeliveryStatusLabel(WHATSAPP_DELIVERY_STATUS.SUCCESS)).toBe("success");
    expect(formatWhatsAppDeliveryStatusLabel(WHATSAPP_DELIVERY_STATUS.FAILED)).toBe("failed");
    expect(formatWhatsAppDeliveryStatusLabel(WHATSAPP_DELIVERY_STATUS.CANCELED)).toBe("canceled");
    expect(formatWhatsAppDeliveryStatusLabel("something-else")).toBe("no");
  });

  it("says send for a bill never sent and resend for one already tried", () => {
    expect(getResendActionLabel(WHATSAPP_DELIVERY_STATUS.NO)).toBe("Send on WhatsApp");
    expect(getResendActionLabel(WHATSAPP_DELIVERY_STATUS.FAILED)).toBe("Resend on WhatsApp");
  });
});

describe("action affordances", () => {
  it("offers resend from every settled status but not while sending", () => {
    for (const status of SETTLED_STATUSES) {
      expect(canResendWhatsAppDelivery(status)).toBe(true);
    }
    expect(canResendWhatsAppDelivery(WHATSAPP_DELIVERY_STATUS.PROCESSING)).toBe(false);
  });

  it("offers cancel only while a delivery is in flight", () => {
    expect(canCancelWhatsAppDelivery(WHATSAPP_DELIVERY_STATUS.PROCESSING)).toBe(true);
    for (const status of SETTLED_STATUSES) {
      expect(canCancelWhatsAppDelivery(status)).toBe(false);
    }
  });

  it("locks editing only while a delivery is in flight", () => {
    expect(isBillLockedForEditing(WHATSAPP_DELIVERY_STATUS.PROCESSING)).toBe(true);
    for (const status of SETTLED_STATUSES) {
      expect(isBillLockedForEditing(status)).toBe(false);
    }
  });

  it("accepts a bill as readily as a status string", () => {
    const bill = { whatsapp_metadata: { status: WHATSAPP_DELIVERY_STATUS.PROCESSING } };

    expect(canCancelWhatsAppDelivery(bill)).toBe(true);
    expect(canResendWhatsAppDelivery(bill)).toBe(false);
    expect(isBillLockedForEditing(bill)).toBe(true);
  });
});

describe("polling", () => {
  it("polls only while something is actually being delivered", () => {
    expect(shouldPollWhatsAppDeliveryStatus(WHATSAPP_DELIVERY_STATUS.PROCESSING)).toBe(true);
    for (const status of SETTLED_STATUSES) {
      expect(shouldPollWhatsAppDeliveryStatus(status)).toBe(false);
    }
  });

  it("polls the bills list while any row is being delivered", () => {
    const bills = [
      { whatsapp_metadata: { status: WHATSAPP_DELIVERY_STATUS.SUCCESS } },
      { whatsapp_metadata: { status: WHATSAPP_DELIVERY_STATUS.PROCESSING } },
    ];

    expect(billHasProcessingWhatsAppDelivery(bills)).toBe(true);
    expect(billHasProcessingWhatsAppDelivery([bills[0]])).toBe(false);
    expect(billHasProcessingWhatsAppDelivery(undefined)).toBe(false);
  });

  it("uses the configured interval", () => {
    expect(getWhatsAppDeliveryPollIntervalMs("5000")).toBe(5000);
  });

  it("falls back to the default for a missing or nonsense value", () => {
    for (const raw of [undefined, "", "abc", "0", "-1"]) {
      expect(getWhatsAppDeliveryPollIntervalMs(raw)).toBe(DEFAULT_POLL_INTERVAL_MS);
    }
  });

  it("refuses an interval that would hammer the API", () => {
    // Polling runs on every open bills view; a mistyped `10` would be a hundred
    // requests a second.
    expect(getWhatsAppDeliveryPollIntervalMs("10")).toBe(MIN_POLL_INTERVAL_MS);
  });
});
