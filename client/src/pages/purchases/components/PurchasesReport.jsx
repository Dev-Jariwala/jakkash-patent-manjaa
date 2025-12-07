import ExportPDF from "@/components/bill-pdf/ExportPDF";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { getPurchasesReport } from "@/services/purchases";
import { PDFViewer } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { format } from "date-fns";
import { useEffect } from "react";
import { toast } from "react-toastify";

const headers = [
    { label: "Date", key: "purchase_date" },
    { label: "Invoice No.", key: "invoice_no" },
    { label: "Supplier Name", key: "supplier_name" },
    { label: "Item Description", key: "item_description" },
    { label: "Rate", key: "rate", price: true },
    { label: "Quantity", key: "quantity" },
    { label: "Total", key: "total", price: true },
];

const PurchasesReport = () => {
    const [activeCollection] = useLocalStorage("activeCollection");

    const { data: purchasesReport, isLoading: isPurchasesReportLoading, error: purchasesReportError } = useQuery({
        queryKey: ["purchasesReport", { collection_id: activeCollection }],
        queryFn: async () => {
            const res = await getPurchasesReport({ collection_id: activeCollection });
            return res.data?.purchases?.map(purchase => {
                return {
                    ...purchase,
                    total: purchase.rate * purchase.quantity,
                    purchase_date: purchase.purchase_date ? format(new Date(purchase.purchase_date), "dd/MM/yyyy") : ""
                }
            }) || [];
        }
    });

    useEffect(() => {
        if (purchasesReportError) {
            toast.error(purchasesReportError?.message || "An error occurred while fetching the report.");
        }
    }, [purchasesReportError])

    return (
        <div className="w-full flex flex-col items-center h-full">
            {isPurchasesReportLoading ?
                <div className="flex items-center justify-between h-64">
                    <TypeWritterLoader />
                </div>
                : <>
                    {purchasesReport?.length > 0 ? (
                        <PDFViewer width="100%" height="100%">
                            <ExportPDF
                                exportData={purchasesReport}
                                headers={headers}
                                title={`Purchases Report`}
                            />
                        </PDFViewer>
                    ) : (
                        <div className="flex items-center justify-center h-64">
                            <h1 className="text-lg font-medium text-center text-gray-500">
                                No purchases found in the collection.
                            </h1>
                        </div>
                    )}
                </>}
        </div>
    );
};

export default PurchasesReport;
