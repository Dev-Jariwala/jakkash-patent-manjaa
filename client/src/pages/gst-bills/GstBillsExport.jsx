import BreadCrum from "@/components/breadcrum/BreadCrum";
import TypeWritterLoader from "@/components/loaders/typewritter/TypeWritterLoader";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GstBillsExportDocument from "@/pages/gst-bills/GstBillsExportDocument";
import {
  BILL_EXPORT_SPAN_BILL_DATE,
  BILL_EXPORT_SPAN_BILL_NUMBER,
  validateGstBillExportForm,
} from "@/pages/gst-bills/gstBillExportValidation";
import {
  billCalendarDateToLocalDate,
  formatBillCalendarDate,
  localDateToBillCalendarIso,
} from "@/pages/gst-bills/billCalendarDate";
import { getAllMastersBillSeries } from "@/services/common";
import { exportGstBills } from "@/services/gstBills";
import { PDFViewer } from "@react-pdf/renderer";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

function ExportField({ label, children }) {
  return (
    <div className="flex w-40 flex-col gap-1.5">
      <label className="text-sm font-medium leading-none">{label}</label>
      {children}
    </div>
  );
}

function BillExportDateField({ label, value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <ExportField label={label}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full justify-start px-3 text-left text-sm font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {value ? formatBillCalendarDate(value) : "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={billCalendarDateToLocalDate(value) ?? undefined}
            onSelect={(date) => {
              if (date) {
                onChange(localDateToBillCalendarIso(date));
                setOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </ExportField>
  );
}

const GstBillsExport = () => {
  const [activeCollection] = useLocalStorage("activeCollection", null);
  const [spanType, setSpanType] = useState(BILL_EXPORT_SPAN_BILL_NUMBER);
  const [seriesPart1, setSeriesPart1] = useState("");
  const [seriesPart2, setSeriesPart2] = useState("");
  const [fromThird, setFromThird] = useState("");
  const [toThird, setToThird] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exportBills, setExportBills] = useState(null);
  const [emptySpanMessage, setEmptySpanMessage] = useState("");

  useEffect(() => {
    setExportBills(null);
    setEmptySpanMessage("");
  }, [activeCollection]);

  const {
    data: billSeries = [],
    isLoading: billSeriesLoading,
    isError: billSeriesError,
  } = useQuery({
    queryKey: ["masters", "bill-series", "all"],
    queryFn: () => getAllMastersBillSeries(),
    enabled: Boolean(activeCollection),
  });

  const { mutate: runExport, isPending: isExportLoading } = useMutation({
    mutationFn: async (payload) => {
      const response = await exportGstBills(activeCollection, payload);
      return response.data?.bills ?? [];
    },
    onSuccess: (bills) => {
      if (!bills.length) {
        setExportBills(null);
        setEmptySpanMessage("There are no Bills in that span.");
        return;
      }
      setEmptySpanMessage("");
      setExportBills(bills);
    },
    onError: (error) => {
      setExportBills(null);
      setEmptySpanMessage("");
      toast.error(error?.response?.data?.message || error?.message || "Export could not run.");
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    setEmptySpanMessage("");
    setExportBills(null);

    if (!activeCollection) {
      toast.error("Choose a collection first.");
      return;
    }

    const validation = validateGstBillExportForm(spanType, {
      seriesPart1,
      seriesPart2,
      fromThird,
      toThird,
      fromDate,
      toDate,
    });
    if (!validation.ok) {
      toast.error(validation.message);
      return;
    }

    runExport(validation.payload);
  };

  const isBillNumberSpan = spanType === BILL_EXPORT_SPAN_BILL_NUMBER;

  return (
    <div className="w-full flex flex-col">
      <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
        <div className="text-xl text-foreground font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/bills", label: "Bills" },
              { path: "/bills/export", label: "Export" },
            ]}
          />
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/bills">Back to Bills</Link>
        </Button>
      </div>

      {!activeCollection ? (
        <div className="px-5 text-muted-foreground">Choose a collection to export bills.</div>
      ) : (
        <div className="px-5 pb-6 pt-2">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <RadioGroup
              value={spanType}
              onValueChange={setSpanType}
              className="flex flex-row gap-6"
            >
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value={BILL_EXPORT_SPAN_BILL_NUMBER} />
                Bill number
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value={BILL_EXPORT_SPAN_BILL_DATE} />
                Bill date
              </label>
            </RadioGroup>

            <div className="flex flex-wrap items-end gap-3">
              {isBillNumberSpan ? (
                <>
                  <ExportField label="Bill series">
                    <Select
                      value={seriesPart1 || undefined}
                      onValueChange={setSeriesPart1}
                      disabled={billSeriesLoading || billSeriesError}
                    >
                      <SelectTrigger
                        className="h-10 max-h-10 overflow-hidden whitespace-nowrap [&>span:first-child]:min-w-0 [&>span:first-child]:truncate"
                        isLoading={billSeriesLoading}
                      >
                        <SelectValue placeholder={billSeries.length ? "Select" : "None"} />
                      </SelectTrigger>
                      <SelectContent>
                        {billSeries.map((series) => (
                          <SelectItem key={series.bill_series_id} value={series.name}>
                            {series.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </ExportField>
                  <ExportField label="Year">
                    <Input
                      value={seriesPart2}
                      onChange={(event) => setSeriesPart2(event.target.value)}
                      className="h-10"
                    />
                  </ExportField>
                  <ExportField label="From">
                    <Input
                      value={fromThird}
                      onChange={(event) => setFromThird(event.target.value)}
                      className="h-10"
                    />
                  </ExportField>
                  <ExportField label="To">
                    <Input
                      value={toThird}
                      onChange={(event) => setToThird(event.target.value)}
                      className="h-10"
                    />
                  </ExportField>
                </>
              ) : (
                <>
                  <BillExportDateField label="From" value={fromDate} onChange={setFromDate} />
                  <BillExportDateField label="To" value={toDate} onChange={setToDate} />
                </>
              )}
              <Button
                type="submit"
                variant="indigo"
                className="h-10 md:self-end"
                disabled={isExportLoading}
              >
                {isExportLoading ? "Exporting…" : "Export"}
              </Button>
            </div>

            {isBillNumberSpan && billSeriesError ? (
              <p className="text-sm text-destructive">Bill series could not be loaded.</p>
            ) : null}
            {emptySpanMessage ? (
              <p className="text-sm text-muted-foreground">{emptySpanMessage}</p>
            ) : null}
          </form>

          {isExportLoading ? (
            <div className="flex items-center justify-center h-64 w-full">
              <TypeWritterLoader />
            </div>
          ) : null}

          {exportBills?.length ? (
            <div className="w-full h-[calc(100dvh-280px)] min-h-[400px]">
              <PDFViewer width="100%" height="100%">
                <GstBillsExportDocument bills={exportBills} />
              </PDFViewer>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default GstBillsExport;
