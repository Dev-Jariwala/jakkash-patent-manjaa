import BillPDF2 from "@/components/bill-pdf/BillPDF2";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { getBillById } from "@/services/bills";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom"
import { toast } from "react-toastify";

const BillsView = () => {
    const [activeCollection] = useLocalStorage("activeCollection");
    const [searchParams] = useSearchParams();
    const bill_id = searchParams.get("bill_id");
    const { data: bill, error, isLoading } = useQuery({
        queryKey: ["bills", activeCollection, bill_id],
        queryFn: async () => {
            const response = await getBillById({ collection_id: activeCollection, bill_id: bill_id });
            return { ...response.data?.bill, products: response.data?.billItems || [] };
        },
        enabled: !!bill_id && !!activeCollection,
    });
    useEffect(() => {
        if (error) {
            toast.error("Error fetching bill");
        }
    }, [error]);
    return (
        <div className="">
            {isLoading ? (
                <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                    <TypeWritterLoader />
                </div>
            ) : (
                <BillPDF2 bill={bill} />
            )}
        </div>
    )
}

export default BillsView