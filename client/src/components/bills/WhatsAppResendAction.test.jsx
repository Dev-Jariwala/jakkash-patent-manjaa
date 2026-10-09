import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WhatsAppResendAction from "@/components/bills/WhatsAppResendAction";
import { billWithStatus, renderWithProviders } from "@/test/renderWithProviders";

const { resendOrderWhatsAppDelivery, getWhatsAppServiceSetting, toastError } = vi.hoisted(() => ({
  resendOrderWhatsAppDelivery: vi.fn(),
  getWhatsAppServiceSetting: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/services/orders", () => ({ resendOrderWhatsAppDelivery }));
vi.mock("@/services/settings", () => ({ getWhatsAppServiceSetting }));
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: toastError },
}));

function serviceEnabled(enabled) {
  getWhatsAppServiceSetting.mockResolvedValue({
    data: { whatsapp_service_enabled: enabled },
  });
}

function renderAction(bill) {
  return renderWithProviders(
    <WhatsAppResendAction bill={bill} collectionId="collection-1" variant="button" />
  );
}

beforeEach(() => {
  resendOrderWhatsAppDelivery.mockReset();
  getWhatsAppServiceSetting.mockReset();
  toastError.mockReset();
  resendOrderWhatsAppDelivery.mockResolvedValue({ data: {} });
});

describe("resend action", () => {
  it("offers to send a bill that has never been delivered", async () => {
    serviceEnabled(true);
    renderAction(billWithStatus("no"));

    expect(await screen.findByRole("button", { name: /send on whatsapp/i })).toBeEnabled();
  });

  it("confirms before sending a second copy of a delivered bill", async () => {
    // Resending a `success` bill is legitimate but the client already has one
    // copy, so the confirmation says so before a duplicate goes out.
    serviceEnabled(true);
    const user = userEvent.setup();
    renderAction(billWithStatus("success"));

    await user.click(await screen.findByRole("button", { name: /resend on whatsapp/i }));

    expect(await screen.findByText(/already delivered/i)).toBeInTheDocument();
    expect(resendOrderWhatsAppDelivery).not.toHaveBeenCalled();
  });

  it("sends only once the operator confirms", async () => {
    serviceEnabled(true);
    const user = userEvent.setup();
    renderAction(billWithStatus("failed"));

    await user.click(await screen.findByRole("button", { name: /resend on whatsapp/i }));
    await user.click(await screen.findByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(resendOrderWhatsAppDelivery).toHaveBeenCalledWith({
        collection_id: "collection-1",
        order_id: "bill-1",
      })
    );
  });

  it("refuses to start a second delivery while one is in flight", async () => {
    serviceEnabled(true);
    renderAction(billWithStatus("processing"));

    const button = await screen.findByRole("button", { name: /resend on whatsapp/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", expect.stringMatching(/already in progress/i));
  });

  it("explains the disabled service and points to settings", async () => {
    // A bare disabled button leaves the operator with no idea why (PRD 37/38).
    serviceEnabled(false);
    const user = userEvent.setup();
    renderAction(billWithStatus("failed"));

    await user.click(await screen.findByRole("button", { name: /resend on whatsapp/i }));

    expect(await screen.findByText(/turned off/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /go to settings/i })).toBeInTheDocument();
    expect(resendOrderWhatsAppDelivery).not.toHaveBeenCalled();
  });

  it("explains a toggle switched off since the page loaded", async () => {
    // The cached setting can be stale; the backend is the source of truth, so a
    // 403 has to produce the same explanation rather than a bare failure toast.
    serviceEnabled(true);
    resendOrderWhatsAppDelivery.mockRejectedValue({
      response: { data: { code: "WHATSAPP_SERVICE_DISABLED", message: "disabled" } },
    });
    const user = userEvent.setup();
    renderAction(billWithStatus("failed"));

    await user.click(await screen.findByRole("button", { name: /resend on whatsapp/i }));
    await user.click(await screen.findByRole("button", { name: "Send" }));

    expect(await screen.findByText(/turned off/i)).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();
  });

  it("reports the backend's reason when a resend is refused", async () => {
    serviceEnabled(true);
    resendOrderWhatsAppDelivery.mockRejectedValue({
      response: {
        data: {
          code: "WHATSAPP_RESEND_NOT_ALLOWED",
          message: "this order already has a WhatsApp delivery in progress.",
        },
      },
    });
    const user = userEvent.setup();
    renderAction(billWithStatus("failed"));

    await user.click(await screen.findByRole("button", { name: /resend on whatsapp/i }));
    await user.click(await screen.findByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        "this order already has a WhatsApp delivery in progress."
      )
    );
  });
});
