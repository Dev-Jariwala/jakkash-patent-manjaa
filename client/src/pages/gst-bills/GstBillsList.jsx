import BreadCrum from "@/components/breadcrum/BreadCrum";
import QueryError from "@/components/Errors/QueryError";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GstBillPdfModal from "@/pages/gst-bills/GstBillPdfModal";
import { listGstBills } from "@/services/gstBills";
import { useQuery } from "@tanstack/react-query";
import { formatBillCalendarDate } from "@/pages/gst-bills/billCalendarDate";
import { Eye, Pencil, Plus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useLocalStorage } from "@uidotdev/usehooks";

function formatAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return "-";
  }
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const GstBillsList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewBillId = searchParams.get("bill_id");
  const [activeCollection] = useLocalStorage("activeCollection", null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["gst-bills", activeCollection],
    queryFn: async () => {
      const response = await listGstBills(activeCollection);
      return response.data?.bills ?? [];
    },
    enabled: Boolean(activeCollection),
  });

  const bills = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
        <div className="text-xl text-foreground font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/bills", label: "Bills" },
            ]}
          />
        </div>
        <Button
          variant="indigo"
          size="sm"
          disabled={!activeCollection}
          onClick={() => navigate("/bills/new")}
        >
          <Plus className="size-4" />
          <div>Add</div>
        </Button>
      </div>

      {!activeCollection ? (
        <div className="px-5 text-muted-foreground">Choose a collection to see bills.</div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="basic-loader"></div>
        </div>
      ) : isError ? (
        <QueryError error={error} />
      ) : bills.length === 0 ? (
        <div className="px-5 text-muted-foreground">No bills yet for this collection.</div>
      ) : (
        <div className="px-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Receiver</TableHead>
                <TableHead className="text-right">Total bill</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.bill_id}>
                  <TableCell>{bill.bill_number}</TableCell>
                  <TableCell>{formatBillCalendarDate(bill.bill_date)}</TableCell>
                  <TableCell>{bill.receiver_name}</TableCell>
                  <TableCell className="text-right">{formatAmount(bill.total_bill)}</TableCell>
                  <TableCell className="flex items-center space-x-2">
                    <Link
                      to={`/bills?bill_id=${bill.bill_id}`}
                      className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                      aria-label="View bill"
                    >
                      <Eye size={16} className="text-blue-500" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => navigate(`/bills/edit/${bill.bill_id}`)}
                      className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                      aria-label="Edit bill"
                    >
                      <Pencil size={16} className="text-green-500" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {viewBillId ? (
        <GstBillPdfModal open={Boolean(viewBillId)} onClose={() => navigate("/bills")} />
      ) : null}
    </div>
  );
};

export default GstBillsList;
