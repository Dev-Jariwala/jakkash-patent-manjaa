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
            <DialogContent className="sm:max-w-3xl p-0 " style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}>
                <DialogHeader className='flex-row justify-between px-4 py-2 border-b'>
                    <DialogTitle className='text-base flex items-center space-x-2'>
                        <span>Bill PDF</span>
                        <Link className="text-blue-500" target="_blank" to={`/bills/view?bill_id=${bill_id}`} ><ExternalLink size={16} /></Link>
                    </DialogTitle>
                    <DialogClose>
                        <X size={20} />
                    </DialogClose>
                </DialogHeader>
                <div className="px-2 pb-2">
                    <BillsView />
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default BillsPdfModal