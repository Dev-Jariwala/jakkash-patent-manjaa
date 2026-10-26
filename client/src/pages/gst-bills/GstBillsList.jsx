import BreadCrum from "@/components/breadcrum/BreadCrum";
import QueryError from "@/components/Errors/QueryError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useEffect, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from "react-icons/md";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";

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
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setSearch("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [activeCollection]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["gst-bills", activeCollection, pagination.pageIndex, pagination.pageSize, debouncedSearch],
    queryFn: async () => {
      const response = await listGstBills(activeCollection, {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
      });
      return response.data;
    },
    enabled: Boolean(activeCollection),
  });

  const bills = data?.bills ?? [];
  const totalItems = data?.pagination?.totalItems ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 0;
  const canPrevious = pagination.pageIndex > 0;
  const canNext = pagination.pageIndex + 1 < totalPages;
  const showEmptyCollection = !debouncedSearch && totalItems === 0;

  const goToPage = (pageIndex) => {
    setPagination((prev) => ({ ...prev, pageIndex }));
  };

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
      ) : (
        <>
          <div className="flex items-center justify-between px-5 mb-3">
            <div className="flex items-center space-x-4">
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                placeholder="Search bill number or receiver"
                className="w-56"
              />
              {search ? (
                <Button
                  variant="none"
                  onClick={() => {
                    setSearch("");
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => setPagination({ pageIndex: 0, pageSize: Number(value) })}
            >
              <SelectTrigger className="w-16 py-1.5">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent align="end" className="min-w-[3rem]">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="basic-loader"></div>
            </div>
          ) : isError ? (
            <QueryError error={error} />
          ) : showEmptyCollection ? (
            <div className="px-5 text-muted-foreground">No bills yet for this collection.</div>
          ) : (
            <>
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
                    {bills.length ? (
                      bills.map((bill) => (
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between p-4">
                <div>{totalItems} Bills</div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(0)}
                    disabled={!canPrevious}
                  >
                    <MdKeyboardDoubleArrowLeft />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.pageIndex - 1)}
                    disabled={!canPrevious}
                  >
                    <IoIosArrowBack />
                  </Button>
                  <Button variant="outline">{pagination.pageIndex + 1}</Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(pagination.pageIndex + 1)}
                    disabled={!canNext}
                  >
                    <IoIosArrowForward />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(Math.max(totalPages - 1, 0))}
                    disabled={!canNext}
                  >
                    <MdKeyboardDoubleArrowRight />
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {viewBillId ? (
        <GstBillPdfModal open={Boolean(viewBillId)} onClose={() => navigate("/bills")} />
      ) : null}
    </div>
  );
};

export default GstBillsList;
