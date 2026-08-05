import BillPDF2 from "@/components/bill-pdf/BillPDF2";
import WhatsAppCancelAction from "@/components/bills/WhatsAppCancelAction";
import WhatsAppDeliveryStatus from "@/components/bills/WhatsAppDeliveryStatus";
import WhatsAppResendAction from "@/components/bills/WhatsAppResendAction";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { getBillById } from "@/services/bills";
import { getWhatsAppDeliveryPollIntervalMs, shouldPollWhatsAppDeliveryStatus } from "@/lib/whatsappDelivery";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom"
import { toast } from "react-toastify";

const BillsView = () => {
    const [activeCollection] = useLocalStorage("activeCollection");
    const [searchParams] = useSearchParams();
    const bill_id = searchParams.get("bill_id");
    const whatsappPollIntervalMs = getWhatsAppDeliveryPollIntervalMs();
    const { data: bill, error, isLoading } = useQuery({
        queryKey: ["bills", activeCollection, bill_id],
        queryFn: async () => {
            const response = await getBillById({ collection_id: activeCollection, bill_id: bill_id });
            return { ...response.data?.bill, products: response.data?.billItems || [] };
        },
        enabled: !!bill_id && !!activeCollection,
        refetchInterval: (query) =>
            shouldPollWhatsAppDeliveryStatus(query.state.data)
                ? whatsappPollIntervalMs
                : false,
    });
    useEffect(() => {
        if (error) {
            toast.error("Error fetching bill");
        }
    }, [error]);
    return (
        <div className="">
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <TypeWritterLoader />
                </div>
            ) : (
                <>
                    {bill && (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">WhatsApp delivery</span>
                            <WhatsAppDeliveryStatus bill={bill} />
                            <div className="ml-auto flex items-center gap-2">
                                <WhatsAppCancelAction
                                    bill={bill}
                                    collectionId={activeCollection}
                                    variant="button"
                                />
                                <WhatsAppResendAction
                                    bill={bill}
                                    collectionId={activeCollection}
                                    variant="button"
                                />
                            </div>
                        </div>
                    )}
                    <BillPDF2 bill={bill} />
                </>
            )}
        </div>
    )
}

export default BillsView