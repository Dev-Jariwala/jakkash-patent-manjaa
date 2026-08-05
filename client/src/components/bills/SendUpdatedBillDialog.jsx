/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import WhatsAppServiceDisabledDialog from "@/components/bills/WhatsAppServiceDisabledDialog";
import { resendBillWhatsAppDelivery } from "@/services/bills";
import {
  getWhatsAppDeliveryStatus,
  WHATSAPP_DELIVERY_STATUS,
} from "@/lib/whatsappDelivery";

/**
 * Post-update prompt: "send the updated bill?" (PRD 31).
 *
 * Sending goes through the existing resend endpoint rather than a second
 * delivery path (PRD 32), so the service toggle, status eligibility, and
 * `processing` transition all behave exactly as they do for a manual resend.
 * Declining leaves the bill updated and undelivered, which is a valid outcome —
 * so `onDone` runs either way.
 */
const SendUpdatedBillDialog = ({ bill, collectionId, open, onDone }) => {
  const queryClient = useQueryClient();
  const [isServiceDisabledOpen, setIsServiceDisabledOpen] = useState(false);

  const previousStatus = getWhatsAppDeliveryStatus(bill);

  const resendMutation = useMutation({
    mutationFn: resendBillWhatsAppDelivery,
    onSuccess: () => {
      toast.success("Updated bill queued for WhatsApp delivery");
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["bill"] });
      onDone();
    },
    onError: (error) => {
      const response = error?.response?.data;
      // The toggle can have been switched off since the form loaded its copy of
      // the setting, so explain it instead of reporting a bare failure.
      if (response?.code === "WHATSAPP_SERVICE_DISABLED") {
        queryClient.invalidateQueries({ queryKey: ["whatsappServiceSetting"] });
        setIsServiceDisabledOpen(true);
        return;
      }

      toast.error(
        response?.message || `Failed to queue WhatsApp delivery: ${error.message}`
      );
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      onDone();
    },
  });

  const handleSend = (event) => {
    // Keep the dialog mounted while the request is in flight.
    event.preventDefault();
    resendMutation.mutate({ collection_id: collectionId, bill_id: bill?.bill_id });
  };

  return (
    <>
      <AlertDialog
        open={open && !isServiceDisabledOpen}
        onOpenChange={(value) =>
          !value && !resendMutation.isPending && !isServiceDisabledOpen && onDone()
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send the updated bill on WhatsApp?</AlertDialogTitle>
            <AlertDialogDescription>
              {previousStatus === WHATSAPP_DELIVERY_STATUS.SUCCESS
                ? `Bill #${bill?.bill_no} was already delivered before this edit. Sending now delivers the updated copy to ${bill?.mobile}, and the client keeps the earlier one.`
                : `Bill #${bill?.bill_no} was updated. Sending delivers the updated bill to ${bill?.mobile} on WhatsApp.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* Closing is handled by `onOpenChange` alone; an extra onClick here
                would resolve the decision twice. */}
            <AlertDialogCancel disabled={resendMutation.isPending}>
              Not now
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSend} disabled={resendMutation.isPending}>
              {resendMutation.isPending ? "Queueing..." : "Send updated bill"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WhatsAppServiceDisabledDialog
        open={isServiceDisabledOpen}
        onClose={() => {
          setIsServiceDisabledOpen(false);
          onDone();
        }}
        action="send this bill"
      />
    </>
  );
};

export default SendUpdatedBillDialog;
