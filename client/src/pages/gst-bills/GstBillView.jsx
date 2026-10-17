/* eslint-disable react/prop-types */
import QueryError from "@/components/Errors/QueryError";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { getGstBill } from "@/services/gstBills";
import { useQuery } from "@tanstack/react-query";
import { PDFViewer } from "@react-pdf/renderer";
import { useLocalStorage } from "@uidotdev/usehooks";
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import GstBillInvoiceDocument from "@/pages/gst-bills/GstBillInvoiceDocument";

const GstBillView = () => {
  const [activeCollection] = useLocalStorage("activeCollection", null);
  const { bill_id: routeBillId } = useParams();
  const [searchParams] = useSearchParams();
  const billId = routeBillId || searchParams.get("bill_id");

  const { data: bill, error, isLoading, isError } = useQuery({
    queryKey: ["gst-bill", activeCollection, billId],
    queryFn: async () => {
      const response = await getGstBill(activeCollection, billId);
      return response.data?.bill;
    },
    enabled: Boolean(activeCollection && billId),
  });

  useEffect(() => {
    if (error) {
      toast.error("Error fetching bill");
    }
  }, [error]);

  if (!activeCollection) {
    return <div className="px-5 py-4 text-muted-foreground">Choose a collection to see this bill.</div>;
  }

  if (!billId) {
    return <div className="px-5 py-4 text-muted-foreground">This bill could not be opened.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <TypeWritterLoader />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-5 py-4">
        <QueryError error={error} />
      </div>
    );
  }

  if (!bill) {
    return <div className="px-5 py-4 text-muted-foreground">This bill could not be opened.</div>;
  }

  return (
    <div className="h-[calc(100dvh-64px)] w-full">
      <PDFViewer width="100%" height="100%">
        <GstBillInvoiceDocument bill={bill} />
      </PDFViewer>
    </div>
  );
};

export default GstBillView;
