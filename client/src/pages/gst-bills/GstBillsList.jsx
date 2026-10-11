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
import { listGstBills } from "@/services/gstBills";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "@uidotdev/usehooks";

function formatBillDate(isoDate) {
  try {
    return format(parseISO(isoDate), "dd/MM/yyyy");
  } catch {
    return isoDate;
  }
}

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
        <div className="px-5">Loading…</div>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.bill_id}>
                  <TableCell>{bill.bill_number}</TableCell>
                  <TableCell>{formatBillDate(bill.bill_date)}</TableCell>
                  <TableCell>{bill.receiver_name}</TableCell>
                  <TableCell className="text-right">{formatAmount(bill.total_bill)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default GstBillsList;
