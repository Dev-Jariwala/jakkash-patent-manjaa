/* eslint-disable react/prop-types */
import { Lock } from "lucide-react";

import WhatsAppCancelAction from "@/components/bills/WhatsAppCancelAction";
import WhatsAppDeliveryStatus from "@/components/bills/WhatsAppDeliveryStatus";
import { EDIT_LOCK_REASON, isBillLockedForEditing } from "@/lib/whatsappDelivery";

/**
 * Shown on the update form while a WhatsApp delivery holds the order (ADR 0005).
 *
 * The lock is useless without a way out, so the force-cancel action is part of
 * the notice itself rather than something the operator has to hunt for on the
 * bills list. The live status chip sits alongside it so the elapsed timer keeps
 * running while they decide.
 */
const WhatsAppEditLockNotice = ({ bill, collectionId }) => {
  if (!isBillLockedForEditing(bill)) {
    return null;
  }

  return (
    <div className="mx-5 mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <Lock size={16} className="text-amber-600 shrink-0" />
        <div className="flex items-center gap-2 text-sm text-foreground">
          <span className="font-medium">Editing is locked</span>
          <WhatsAppDeliveryStatus bill={bill} />
        </div>
        <div className="ml-auto">
          <WhatsAppCancelAction bill={bill} collectionId={collectionId} variant="button" />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {EDIT_LOCK_REASON} You can send the updated order again once it is unlocked.
      </p>
    </div>
  );
};

export default WhatsAppEditLockNotice;
