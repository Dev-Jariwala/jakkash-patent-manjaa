import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import WhatsAppCancelAction from "@/components/bills/WhatsAppCancelAction";
import { billWithStatus, renderWithProviders } from "@/test/renderWithProviders";

const { forceCancelOrderWhatsAppDelivery, toastSuccess, toastError } = vi.hoisted(() => ({
  forceCancelOrderWhatsAppDelivery: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/services/orders", () => ({ forceCancelOrderWhatsAppDelivery }));
vi.mock("react-toastify", () => ({
  toast: { success: toastSuccess, error: toastError },
}));

function renderAction(bill) {
  return renderWithProviders(
    <WhatsAppCancelAction bill={bill} collectionId="collection-1" variant="button" />
  );
}

beforeEach(() => {
  forceCancelOrderWhatsAppDelivery.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  forceCancelOrderWhatsAppDelivery.mockResolvedValue({
    data: { message: "WhatsApp order delivery canceled" },
  });
});

describe("force cancel action", () => {
  it("appears only while a delivery is in flight", () => {
    const { container } = renderAction(billWithStatus("processing"));
    expect(screen.getByRole("button", { name: /force cancel/i })).toBeInTheDocument();
    expect(container).not.toBeEmptyDOMElement();

    for (const status of ["no", "success", "failed", "canceled"]) {
      const { container: settled, unmount } = renderAction(billWithStatus(status));
      expect(settled).toBeEmptyDOMElement();
      unmount();
    }
  });

  it("asks for confirmation before interrupting a valid send", async () => {
    const user = userEvent.setup();
    renderAction(billWithStatus("processing"));

    await user.click(screen.getByRole("button", { name: /force cancel/i }));

    expect(await screen.findByText(/force cancel this whatsapp delivery/i)).toBeInTheDocument();
    expect(forceCancelOrderWhatsAppDelivery).not.toHaveBeenCalled();
  });

  it("says plainly that a send already on its way cannot be pulled back", async () => {
    // Cancel is best-effort once the message is out (ADR 0006); the copy must
    // not promise a hard stop.
    const user = userEvent.setup();
    renderAction(billWithStatus("processing"));

    await user.click(screen.getByRole("button", { name: /force cancel/i }));

    expect(await screen.findByText(/cannot be pulled\s+back/i)).toBeInTheDocument();
  });

  it("leaves the delivery running when the operator backs out", async () => {
    const user = userEvent.setup();
    renderAction(billWithStatus("processing"));

    await user.click(screen.getByRole("button", { name: /force cancel/i }));
    await user.click(await screen.findByRole("button", { name: /keep sending/i }));

    expect(forceCancelOrderWhatsAppDelivery).not.toHaveBeenCalled();
  });

  it("cancels the delivery once confirmed", async () => {
    const user = userEvent.setup();
    renderAction(billWithStatus("processing"));

    await user.click(screen.getByRole("button", { name: /force cancel/i }));
    await user.click(await screen.findByRole("button", { name: "Force cancel" }));

    await waitFor(() =>
      expect(forceCancelOrderWhatsAppDelivery).toHaveBeenCalledWith({
        collection_id: "collection-1",
        order_id: "bill-1",
      })
    );
  });

  it("refreshes the order so a stale processing chip cannot linger", async () => {
    // A delivery that settled while the dialog was open makes the cancel fail;
    // the list must still pull in the real status.
    forceCancelOrderWhatsAppDelivery.mockRejectedValue({
      response: { data: { message: "WhatsApp delivery is not in progress for this order" } },
    });
    const user = userEvent.setup();
    const { queryClient } = renderAction(billWithStatus("processing"));
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(screen.getByRole("button", { name: /force cancel/i }));
    await user.click(await screen.findByRole("button", { name: "Force cancel" }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("WhatsApp delivery is not in progress for this order")
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["orders"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["order"] });
  });
});
