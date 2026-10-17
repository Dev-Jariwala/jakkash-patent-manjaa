/* eslint-disable react/prop-types */
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/tremor-dialog";
import GstBillView from "@/pages/gst-bills/GstBillView";
import { ExternalLink, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

const GstBillPdfModal = ({ open, onClose }) => {
  const [searchParams] = useSearchParams();
  const billId = searchParams.get("bill_id");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-5xl p-0" style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}>
        <DialogHeader className="flex-row justify-between px-4 py-2 border-b">
          <DialogTitle className="text-base flex items-center space-x-2">
            <span>Bill</span>
            <Link className="text-blue-500" target="_blank" to={`/bills/view/${billId}`}>
              <ExternalLink size={16} />
            </Link>
          </DialogTitle>
          <DialogClose>
            <X size={20} />
          </DialogClose>
        </DialogHeader>
        <div className="px-2 pb-2">
          <GstBillView />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GstBillPdfModal;
