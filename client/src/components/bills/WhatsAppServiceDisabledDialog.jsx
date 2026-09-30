/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";

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

/**
 * The single explanation shown whenever a WhatsApp delivery action is blocked by
 * the service toggle, with the path back to Settings (PRD 37/38). Shared so the
 * resend action and the post-update prompt never drift on the reason they give.
 */
const WhatsAppServiceDisabledDialog = ({ open, onClose, action = "resend this bill" }) => {
  const navigate = useNavigate();

  return (
    <AlertDialog open={open} onOpenChange={(value) => !value && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>WhatsApp bill delivery is turned off</AlertDialogTitle>
          <AlertDialogDescription>
            No bills can be sent on WhatsApp while the service is disabled. Normal
            billing is unaffected. Enable it in Settings to {action}.
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
  );
};

export default WhatsAppServiceDisabledDialog;
