import ExportPDF from "@/components/bill-pdf/ExportPDF";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrderReport } from "@/services/orders";
import { PDFViewer } from "@react-pdf/renderer";
import { useMutation } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { BILL_NUMBER_LABEL } from "@jakkash/bill-pdf";

const headers = [
    { label: `${BILL_NUMBER_LABEL}.`, key: "order_no" },
    { label: "Name", key: "name" },
    { label: "Total Firki", key: "total_firki" },
];

const BillsReport = () => {
    const { orderType } = useParams();
    const [activeCollection] = useLocalStorage("activeCollection");
    const [fromBillNo, setFromBillNo] = useState("");
    const [toBillNo, setToBillNo] = useState("");
    const [reportData, setReportData] = useState([]);

    const { mutate: fetchReport, isPending: isReportLoading, error: reportError } = useMutation({
        mutationFn: async () => {
            const res = await getOrderReport({
                collection_id: activeCollection,
                order_type: orderType,
                fromBillNo,
                toBillNo
            });
            return res.data?.orders || [];
        },
        onSuccess: (data) => {
            setReportData(data);
        },
        onError: (error) => {
            toast.error(error?.message || "An error occurred while fetching the report.");
        },
    });

    const handleGenerateReport = () => {
        if (!activeCollection || !orderType || !fromBillNo || !toBillNo) {
            toast.error("Please provide all required inputs.");
            return;
        }
        fetchReport();
    };

    useEffect(() => {
        if (reportError) {
            toast.error(reportError?.message || "An error occurred while fetching the report.");
        }
    }, [reportError])

    return (
        <div className="w-full flex flex-col items-center">
            <div className="flex items-center space-x-5 w-[50%] my-5">
                <div className="space-y-2">
                    <Input
                        value={fromBillNo}
                        placeholder={`From ${BILL_NUMBER_LABEL}`}
                        onChange={(e) => setFromBillNo(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Input
                        value={toBillNo}
                        placeholder={`To ${BILL_NUMBER_LABEL}`}
                        onChange={(e) => setToBillNo(e.target.value)}
                    />
                </div>
                <Button onClick={handleGenerateReport}>
                    {isReportLoading ? "Generating..." : "Generate Report"}
                </Button>
            </div>
            {isReportLoading ?
                <div className="flex items-center justify-between h-64">
                    <TypeWritterLoader />
                </div>
                : <>
                    {reportData.length > 0 && (
                        <PDFViewer width="100%" height="550">
                            <ExportPDF
                                exportData={reportData}
                                headers={headers}
                                title={`${orderType === "retail" ? "Retail" : "Wholesale"} Report`}
                            />
                        </PDFViewer>
                    )}
                </>}
        </div>
    );
};

export default BillsReport;
