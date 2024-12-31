import ExportPDF from "@/components/bill-pdf/ExportPDF";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { getStocksReport } from "@/services/stocks";
import { PDFViewer } from "@react-pdf/renderer";
import { useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { format } from "date-fns";
import { useEffect } from "react";
import { toast } from "react-toastify";

const headers = [
    { label: "Date", key: "date" },
    { label: "Product Name", key: "product_name" },
    { label: "Stock", key: "quantity" },
];

const StocksReport = () => {
    const [activeCollection] = useLocalStorage("activeCollection");

    const { data: stocksReport, isLoading: isStockReportLoading, error: stocksReportError } = useQuery({
        queryKey: ["stocksReport", { collection_id: activeCollection }],
        queryFn: async () => {
            const res = await getStocksReport({ collection_id: activeCollection });
            return res.data?.stocks?.map(stock => {
                return {
                    ...stock,
                    date: stock?.date ? format(new Date(stock.date), "dd/MM/yyyy") : ""
                }
            }) || [];
        }
    });

    useEffect(() => {
        if (stocksReportError) {
            toast.error(stocksReportError?.message || "An error occurred while fetching the report.");
        }
    }, [stocksReportError])

    return (
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-h-full">
            {isStockReportLoading ?
                <div className="tw-flex tw-items-center tw-justify-between tw-h-64">
                    <TypeWritterLoader />
                </div>
                : <>
                    {stocksReport?.length > 0 ? (
                        <PDFViewer width="100%" height="100%">
                            <ExportPDF
                                exportData={stocksReport}
                                headers={headers}
                                title={`Stocks Report`}
                            />
                        </PDFViewer>
                    ) : (
                        <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                            <h1 className="tw-text-lg tw-font-medium tw-text-center tw-text-gray-500">
                                No stocks found in the collection.
                            </h1>
                        </div>
                    )}
                </>}
        </div>
    );
};

export default StocksReport;
