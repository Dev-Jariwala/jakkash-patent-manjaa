import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WhatsAppDeliveryStatus from "@/components/bills/WhatsAppDeliveryStatus";
import { PROCESSING_STALL_SECONDS } from "@/lib/whatsappDelivery";
import { billWithStatus } from "@/test/renderWithProviders";

const NOW = new Date("2026-01-01T00:01:00.000Z");

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

function processingSince(secondsAgo) {
  return billWithStatus("processing", {
    processing_started_at: new Date(NOW.getTime() - secondsAgo * 1000).toISOString(),
  });
}

describe("WhatsApp delivery status chip", () => {
  it("shows each settled outcome by name", () => {
    for (const status of ["no", "success", "failed", "canceled"]) {
      const { unmount } = render(<WhatsAppDeliveryStatus bill={billWithStatus(status)} />);
      expect(screen.getByText(status)).toBeInTheDocument();
      unmount();
    }
  });

  it("shows a bill from before the feature as never sent", () => {
    render(<WhatsAppDeliveryStatus bill={{ order_no: 7 }} />);

    expect(screen.getByText("no")).toBeInTheDocument();
  });

  it("shows how long the delivery has been running", () => {
    render(<WhatsAppDeliveryStatus bill={processingSince(30)} />);

    expect(screen.getByText("processing(30s)")).toBeInTheDocument();
  });

  it("keeps the timer ticking while the delivery runs", () => {
    // the order itself does not change during this second; the chip has to
    // advance on its own or the operator sees a frozen counter.
    render(<WhatsAppDeliveryStatus bill={processingSince(30)} />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText("processing(32s)")).toBeInTheDocument();
  });

  it("explains the provider error behind a failed delivery", () => {
    render(
      <WhatsAppDeliveryStatus
        bill={billWithStatus("failed", { error_message: "Template does not exist" })}
      />
    );

    expect(screen.getByText("failed")).toHaveAttribute("title", "Template does not exist");
  });

  it("warns when a delivery has been running far too long", () => {
    render(<WhatsAppDeliveryStatus bill={processingSince(PROCESSING_STALL_SECONDS + 5)} />);

    const chip = screen.getByText(`processing(${PROCESSING_STALL_SECONDS + 5}s)`);
    expect(chip).toHaveAttribute("title", expect.stringMatching(/force cancel/i));
  });

  it("does not warn about a delivery that only just started", () => {
    render(<WhatsAppDeliveryStatus bill={processingSince(5)} />);

    expect(screen.getByText("processing(5s)")).not.toHaveAttribute("title");
  });
});
