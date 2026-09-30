import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SendUpdatedBillDialog from "@/components/bills/SendUpdatedBillDialog";
import { billWithStatus, renderWithProviders } from "@/test/renderWithProviders";

const { resendBillWhatsAppDelivery, toastSuccess, toastError } = vi.hoisted(() => ({
  resendBillWhatsAppDelivery: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/services/bills", () => ({ resendBillWhatsAppDelivery }));
vi.mock("react-toastify", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

function renderDialog(bill, onDone = vi.fn()) {
  const utils = renderWithProviders(
    <SendUpdatedBillDialog bill={bill} collectionId="collection-1" open onDone={onDone} />
  );
  return { ...utils, onDone };
}

beforeEach(() => {
  resendBillWhatsAppDelivery.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  resendBillWhatsAppDelivery.mockResolvedValue({ data: {} });
});

describe("send updated bill prompt", () => {
  it("asks rather than sending the edit automatically", async () => {
    // Resending after an edit stays an explicit choice (PRD 31).
    renderDialog(billWithStatus("success"));

    expect(
      await screen.findByText(/send the updated bill on whatsapp\?/i)
    ).toBeInTheDocument();
    expect(resendBillWhatsAppDelivery).not.toHaveBeenCalled();
  });

  it("warns that the client keeps the copy sent before the edit", async () => {
    renderDialog(billWithStatus("success"));

    expect(await screen.findByText(/keeps the earlier one/i)).toBeInTheDocument();
  });

  it("reuses the resend endpoint rather than a second delivery path", async () => {
    // PRD 32: the toggle, status rules and processing transition then behave
    // exactly as they do for a manual resend.
    const user = userEvent.setup();
    renderDialog(billWithStatus("canceled"));

    await user.click(await screen.findByRole("button", { name: /send updated bill/i }));

    await waitFor(() =>
      expect(resendBillWhatsAppDelivery).toHaveBeenCalledWith({
        collection_id: "collection-1",
        bill_id: "bill-1",
      })
    );
  });

  it("leaves the bill updated and unsent when the operator declines", async () => {
    const user = userEvent.setup();
    const { onDone } = renderDialog(billWithStatus("failed"));

    await user.click(await screen.findByRole("button", { name: /not now/i }));

    expect(resendBillWhatsAppDelivery).not.toHaveBeenCalled();
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });

  it("explains a service switched off since the form loaded", async () => {
    resendBillWhatsAppDelivery.mockRejectedValue({
      response: { data: { code: "WHATSAPP_SERVICE_DISABLED", message: "disabled" } },
    });
    const user = userEvent.setup();
    const { onDone } = renderDialog(billWithStatus("failed"));

    await user.click(await screen.findByRole("button", { name: /send updated bill/i }));

    expect(await screen.findByText(/turned off/i)).toBeInTheDocument();
    expect(toastError).not.toHaveBeenCalled();
    // The edit itself succeeded, so the form must not stay blocked on this.
    expect(onDone).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /close/i }));
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  });
});
