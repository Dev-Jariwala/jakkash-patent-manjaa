/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
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
import { resendBillWhatsAppDelivery } from "@/services/bills";
import { getWhatsAppServiceSetting } from "@/services/settings";
import {
  canResendWhatsAppDelivery,
  getResendActionLabel,
  getWhatsAppDeliveryStatus,
  WHATSAPP_DELIVERY_STATUS,
} from "@/lib/whatsappDelivery";

/**
 * Dedicated resend affordance for WhatsApp bill delivery.
 *
 * Three mutually exclusive states drive the UX:
 *  - service disabled  -> explain why and offer a path to Settings (PRD 37/38)
 *  - delivery processing -> action unavailable, only one attempt in flight (PRD 25)
 *  - otherwise          -> confirm, then resend (PRD 26)
 *
 * The backend re-checks all of this; this component only shapes the affordance.
 */
const WhatsAppResendAction = ({ bill, collectionId, variant = "icon", className }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState(null);

  const { data: serviceSetting, isError: isServiceSettingError } = useQuery({
    queryKey: ["whatsappServiceSetting"],
    queryFn: async () => {
      const response = await getWhatsAppServiceSetting();
      return response.data;
    },
  });

  const serviceEnabled =
    !isServiceSettingError && !!serviceSetting?.whatsapp_service_enabled;

  const status = getWhatsAppDeliveryStatus(bill);
  const isProcessing = status === WHATSAPP_DELIVERY_STATUS.PROCESSING;
  const statusAllowsResend = canResendWhatsAppDelivery(status);
  const label = getResendActionLabel(status);

  const resendMutation = useMutation({
    mutationFn: resendBillWhatsAppDelivery,
    onSuccess: () => {
      toast.success("WhatsApp bill delivery queued");
      setDialog(null);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
    onError: (error) => {
      const response = error?.response?.data;
      // A disabled toggle can land here when the cached setting is stale, so
      // swap the confirm dialog for the explanation instead of a bare toast.
      if (response?.code === "WHATSAPP_SERVICE_DISABLED") {
        setDialog("disabled");
        queryClient.invalidateQueries({ queryKey: ["whatsappServiceSetting"] });
        return;
      }

      setDialog(null);
      toast.error(response?.message || `Failed to queue WhatsApp delivery: ${error.message}`);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });

  const handleClick = () => {
    if (!serviceEnabled) {
      setDialog("disabled");
      return;
    }
    setDialog("confirm");
  };

  const handleConfirm = (event) => {
    // Keep the dialog mounted while the request is in flight.
    event.preventDefault();
    resendMutation.mutate({ collection_id: collectionId, bill_id: bill?.bill_id });
  };

  const disabledReason = isProcessing
    ? "A WhatsApp delivery is already in progress for this bill"
    : !statusAllowsResend
      ? `WhatsApp delivery cannot be resent from status "${status}"`
      : undefined;

  const isDisabled = !statusAllowsResend || resendMutation.isPending;

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          title={disabledReason || label}
          aria-label={label}
          className="hover:bg-accent rounded-full size-8 flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none"
        >
          {resendMutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <Send size={16} className="text-emerald-500" />
          )}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={isDisabled}
          title={disabledReason || label}
          className={className}
        >
          {resendMutation.isPending ? (
            <Spinner className="size-4 mr-2" />
          ) : (
            <Send size={14} className="mr-2 text-emerald-500" />
          )}
          {label}
        </Button>
      )}

      <AlertDialog
        open={dialog === "confirm"}
        onOpenChange={(open) => !open && !resendMutation.isPending && setDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{label}?</AlertDialogTitle>
            <AlertDialogDescription>
              {status === WHATSAPP_DELIVERY_STATUS.SUCCESS
                ? `Bill #${bill?.bill_no} was already delivered on WhatsApp. Sending again will deliver a second copy to ${bill?.mobile}.`
                : `Bill #${bill?.bill_no} will be generated and sent to ${bill?.mobile} on WhatsApp.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resendMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={resendMutation.isPending}>
              {resendMutation.isPending ? "Queueing..." : "Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialog === "disabled"} onOpenChange={(open) => !open && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>WhatsApp bill delivery is turned off</AlertDialogTitle>
            <AlertDialogDescription>
              No bills can be sent on WhatsApp while the service is disabled. Normal
              billing is unaffected. Enable it in Settings to resend this bill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/settings")}>
              Go to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WhatsAppResendAction;
