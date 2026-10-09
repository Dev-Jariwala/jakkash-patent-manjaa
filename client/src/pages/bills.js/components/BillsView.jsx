import BillPDF2 from "@/components/bill-pdf/BillPDF2";
import WhatsAppCancelAction from "@/components/bills/WhatsAppCancelAction";
import WhatsAppDeliveryStatus from "@/components/bills/WhatsAppDeliveryStatus";
import WhatsAppResendAction from "@/components/bills/WhatsAppResendAction";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { getOrderById } from "@/services/orders";
import { getWhatsAppDeliveryPollIntervalMs, shouldPollWhatsAppDeliveryStatus } from "@/lib/whatsappDelivery";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom"
import { toast } from "react-toastify";

const BillsView = () => {
    const [activeCollection] = useLocalStorage("activeCollection");
    const [searchParams] = useSearchParams();
    const order_id = searchParams.get("order_id");
    const whatsappPollIntervalMs = getWhatsAppDeliveryPollIntervalMs();
    const { data: bill, error, isLoading } = useQuery({
        queryKey: ["orders", activeCollection, order_id],
        queryFn: async () => {
            const response = await getOrderById({ collection_id: activeCollection, order_id: order_id });
            return { ...response.data?.order, products: response.data?.orderItems || [] };
        },
        enabled: !!order_id && !!activeCollection,
        refetchInterval: (query) =>
            shouldPollWhatsAppDeliveryStatus(query.state.data)
                ? whatsappPollIntervalMs
                : false,
    });
    useEffect(() => {
        if (error) {
            toast.error("Error fetching order");
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