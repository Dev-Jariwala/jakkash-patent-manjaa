/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { toast } from "react-toastify";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { forceCancelOrderWhatsAppDelivery } from "@/services/orders";
import { canCancelWhatsAppDelivery, getWhatsAppDeliveryStatus } from "@/lib/whatsappDelivery";
import { BILL_NUMBER_LABEL } from "@jakkash/bill-pdf";

const CANCEL_LABEL = "Force cancel delivery";

/**
 * Force-cancel affordance for a WhatsApp order delivery that is still in flight.
 *
 * Rendered next to the `processing` status (PRD 20) and only while the order is
 * actually processing, so the action never competes with the resend button.
 * Cancellation is best-effort for an attempt the worker already picked up
 * (ADR 0006), which the confirmation copy states plainly rather than promising
 * an instant abort. The backend re-checks eligibility.
 */
const WhatsAppCancelAction = ({ bill, collectionId, variant = "icon", className }) => {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const status = getWhatsAppDeliveryStatus(bill);

  const cancelMutation = useMutation({
    mutationFn: forceCancelOrderWhatsAppDelivery,
    onSuccess: (response) => {
      toast.success(response?.data?.message || "WhatsApp order delivery canceled");
      setIsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // The edit form reads the order under its own key; refreshing it is what
      // lifts the edit lock as soon as the cancel lands (ADR 0005).
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
    onError: (error) => {
      const response = error?.response?.data;
      setIsConfirmOpen(false);
      toast.error(response?.message || `Failed to cancel WhatsApp delivery: ${error.message}`);
      // A delivery that finished while the dialog was open lands here, so pull
      // the real status back in instead of leaving a stale `processing` chip.
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // The edit form reads the order under its own key; refreshing it is what
      // lifts the edit lock as soon as the cancel lands (ADR 0005).
      queryClient.invalidateQueries({ queryKey: ["order"] });
    },
  });

  if (!canCancelWhatsAppDelivery(status)) {
    return null;
  }

  const handleConfirm = (event) => {
    // Keep the dialog mounted while the request is in flight.
    event.preventDefault();
    cancelMutation.mutate({ collection_id: collectionId, order_id: bill?.order_id });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setIsConfirmOpen(true)}
          disabled={cancelMutation.isPending}
          title={CANCEL_LABEL}
          aria-label={CANCEL_LABEL}
          className="hover:bg-accent rounded-full size-6 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
        >
          {cancelMutation.isPending ? (
            <Spinner className="size-3" />
          ) : (
            <Ban size={14} className="text-amber-600" />
          )}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsConfirmOpen(true)}
          disabled={cancelMutation.isPending}
          title={CANCEL_LABEL}
          className={className}
        >
          {cancelMutation.isPending ? (
            <Spinner className="size-4 mr-2" />
          ) : (
            <Ban size={14} className="mr-2 text-amber-600" />
          )}
          {CANCEL_LABEL}
        </Button>
      )}

      <AlertDialog
        open={isConfirmOpen}
        onOpenChange={(open) => !open && !cancelMutation.isPending && setIsConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force cancel this WhatsApp delivery?</AlertDialogTitle>
            <AlertDialogDescription>
              {BILL_NUMBER_LABEL} {bill?.order_no} is still being sent to {bill?.mobile}. Canceling
              marks the delivery as <strong>canceled</strong> and unlocks the order for
              editing. If the send has already reached WhatsApp it cannot be pulled
              back, so the client may still receive this copy. You can resend the order
              afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              Keep sending
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? "Canceling..." : "Force cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WhatsAppCancelAction;
