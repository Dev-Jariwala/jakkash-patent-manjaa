/* eslint-disable react/prop-types */
// import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/tremor-dialog"
import BillsView from "./BillsView"
import { ExternalLink, X } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

const BillsPdfModal = ({ open, onClose }) => {
    const [searchParams] = useSearchParams();
    const bill_id = searchParams.get('bill_id');
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:tw-max-w-3xl tw-p-0 " style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}>
                <DialogHeader className='tw-flex-row tw-justify-between tw-px-4 tw-py-2 tw-border-b'>
                    <DialogTitle className='tw-text-base tw-flex tw-items-center tw-space-x-2'>
                        <span>Bill PDF</span>
                        <Link className="tw-text-blue-500" target="_blank" to={`/bills/view?bill_id=${bill_id}`} ><ExternalLink size={16} /></Link>
                    </DialogTitle>
                    <DialogClose>
                        <X size={20} />
                    </DialogClose>
                </DialogHeader>
                <div className="tw-px-2 tw-pb-2">
                    <BillsView />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default BillsPdfModal