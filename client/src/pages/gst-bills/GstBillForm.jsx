import BreadCrum from "@/components/breadcrum/BreadCrum";
import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ReactSelect from "@/components/ui/react-select/react-select";
import { Option as SelectOption } from "@/components/ui/react-select/components";
import { defaultStyles } from "@/components/ui/react-select/helper";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getAllClients } from "@/services/clients";
import { createGstBill, getGstBill, previewGstBillTotals, updateGstBill } from "@/services/gstBills";
import { getAllMastersTaxCodes } from "@/services/common";
import { getProductsByCollectionId } from "@/services/products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import {
  billCalendarDateToLocalDate,
  formatBillCalendarDate,
  localDateToBillCalendarIso,
  normalizeBillCalendarDate,
} from "@/pages/gst-bills/billCalendarDate";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  emptyLineFieldErrors,
  validateGstBillForm,
} from "@/pages/gst-bills/gstBillFormValidation";
import { RequiredMark } from "@/components/form/RequiredMark";

const compactInputClass = "h-9 tabular-nums";
const invalidInputClass = "border-destructive focus-visible:ring-destructive";
const percentInputClass = "h-9 w-[3.25rem] min-w-[3.25rem] px-1 text-center tabular-nums";
const taxSectionClass = "border-l border-border/70 bg-muted/20";
const LINE_TABLE_COLUMN_COUNT = 13;

function FieldError({ message }) {
  if (!message) {
    return null;
  }
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

/** One message per table row — avoids uneven column heights in line-item grids. */
function summarizeLineErrors(lineErrors) {
  if (!lineErrors) {
    return null;
  }
  const fieldMessages = [
    lineErrors.product,
    lineErrors.quantity,
    lineErrors.rate,
    lineErrors.cgst,
    lineErrors.sgst,
    lineErrors.igst,
    lineErrors.tax,
  ].filter(Boolean);
  if (fieldMessages.length > 0) {
    return [...new Set(fieldMessages)].join(" · ");
  }
  return lineErrors.line || null;
}

function ReadonlyAmount({ value }) {
  return (
    <Input
      readOnly
      tabIndex={-1}
      value={value || ""}
      className={cn(
        compactInputClass,
        "cursor-default border-input bg-muted/25 text-right text-foreground shadow-none",
        "focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0"
      )}
    />
  );
}

const billSelectProps = {
  menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
  menuPosition: "fixed",
  menuPlacement: "auto",
  maxMenuHeight: 280,
  styles: {
    ...defaultStyles,
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  },
};

function emptyLine() {
  return {
    bill_line_id: "",
    product_id: "",
    tax_code_id: "",
    loaded_product_id: "",
    stored_product_name: "",
    loaded_tax_code_id: "",
    stored_tax_code: "",
    product_chosen_again: false,
    quantity: "",
    rate: "",
    cgst_percent: 0,
    sgst_percent: 0,
    igst_percent: 0,
  };
}

function productOptionsForLine(line, catalogOptions, isEdit) {
  const options = catalogOptions.map((o) => ({ ...o }));
  if (
    isEdit &&
    line.loaded_product_id &&
    line.product_id === line.loaded_product_id &&
    line.stored_product_name
  ) {
    const index = options.findIndex((o) => o.value === line.product_id);
    if (index >= 0) {
      options[index] = { ...options[index], label: line.stored_product_name };
    } else {
      options.push({
        value: line.product_id,
        label: line.stored_product_name,
        wholesale_price: line.rate,
      });
    }
  }
  return options;
}

function receiverCopyFromBill(bill) {
  return {
    name: bill.receiver_name,
    address: bill.receiver_address ?? "",
    gst_number: bill.receiver_gst_number ?? "",
    contact_person: bill.receiver_contact_person ?? "",
    contact_number: bill.receiver_contact_number ?? "",
  };
}

function isBlankLine(line) {
  return !line.product_id && !line.tax_code_id && !String(line.quantity ?? "").trim();
}

function isCompleteLine(line) {
  if (isBlankLine(line)) {
    return false;
  }
  return (
    Boolean(line.product_id) &&
    Boolean(line.tax_code_id) &&
    Boolean(String(line.quantity ?? "").trim()) &&
    String(line.rate ?? "").trim() !== ""
  );
}

function canSubmitGstBill({ hasCompleteLine, preview, previewError, discountPercent }) {
  if (!hasCompleteLine || !preview || previewError) {
    return false;
  }
  const totalBill = Number(preview.total_bill);
  if (Number.isFinite(totalBill) && totalBill > 0) {
    return true;
  }
  const discount = Number(String(discountPercent ?? "").trim());
  return Number.isFinite(discount) && discount === 100;
}

function formatAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function taxCodeLabel(taxCode) {
  if (!taxCode?.type || !taxCode?.code) {
    return "";
  }
  return `${taxCode.type} ${taxCode.code}`;
}

function hsnSacDisplayForLine(line, taxCodes) {
  const catalog = taxCodes.find((t) => t.tax_code_id === line.tax_code_id);
  if (
    line.loaded_tax_code_id &&
    line.tax_code_id === line.loaded_tax_code_id &&
    line.stored_tax_code
  ) {
    const type = catalog?.type ?? "HSN";
    return `${type} ${line.stored_tax_code}`;
  }
  return taxCodeLabel(catalog);
}

function taxCodeFieldsFromProduct(option, taxCodes) {
  const taxCode = taxCodes.find((t) => t.tax_code_id === option.tax_code_id);
  if (!taxCode) {
    return {};
  }
  return {
    tax_code_id: taxCode.tax_code_id,
    cgst_percent: taxCode.cgst,
    sgst_percent: taxCode.sgst,
    igst_percent: 0,
    loaded_tax_code_id: "",
    stored_tax_code: "",
  };
}

function productSelectComponentsForReselect(currentProductId, onReselectSame) {
  if (!currentProductId) {
    return {};
  }
  return {
    Option: (props) => {
      const { innerProps, data } = props;
      return (
        <SelectOption
          {...props}
          innerProps={{
            ...innerProps,
            onMouseDown: (event) => {
              if (data.value === currentProductId) {
                onReselectSame(data);
              }
              innerProps.onMouseDown?.(event);
            },
          }}
        />
      );
    },
  };
}

const GstBillForm = () => {
  const navigate = useNavigate();
  const { bill_id: billId } = useParams();
  const isEdit = Boolean(billId);
  const queryClient = useQueryClient();
  const [activeCollection] = useLocalStorage("activeCollection", null);

  const [billNumberParts, setBillNumberParts] = useState(["", "", ""]);
  const [billDate, setBillDate] = useState(() => localDateToBillCalendarIso(new Date()));
  const [receiverMobile, setReceiverMobile] = useState("");
  const [originalReceiverMobile, setOriginalReceiverMobile] = useState("");
  const [storedReceiverCopy, setStoredReceiverCopy] = useState(null);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [lines, setLines] = useState([emptyLine()]);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [formHydrated, setFormHydrated] = useState(!isEdit);
  const [validationErrors, setValidationErrors] = useState(null);

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ["products", activeCollection],
    queryFn: async () => {
      const response = await getProductsByCollectionId({
        activeCollection,
        pagination: { pageIndex: -2 },
      });
      return response.data?.products ?? [];
    },
    enabled: Boolean(activeCollection),
  });

  const { data: taxCodes = [], isLoading: taxCodesLoading, error: taxCodesError } = useQuery({
    queryKey: ["masters", "tax-codes", "all"],
    queryFn: () => getAllMastersTaxCodes(),
  });

  const { data: clients = [], isLoading: clientsLoading, error: clientsError } = useQuery({
    queryKey: ["clients", "all"],
    queryFn: async () => {
      const response = await getAllClients();
      return (response.data?.clients ?? []).filter((c) => c.gst_number);
    },
  });

  const {
    data: existingBill,
    isLoading: billLoading,
    error: billError,
  } = useQuery({
    queryKey: ["gst-bill", activeCollection, billId],
    queryFn: async () => {
      const response = await getGstBill(activeCollection, billId);
      return response.data?.bill;
    },
    enabled: Boolean(isEdit && activeCollection && billId),
  });

  useEffect(() => {
    if (!existingBill || formHydrated) {
      return;
    }
    const parts = existingBill.bill_number_parts;
    setBillNumberParts(
      parts?.length === 3 ? parts.map(String) : existingBill.bill_number.split("-")
    );
    setBillDate(normalizeBillCalendarDate(existingBill.bill_date));
    setReceiverMobile(existingBill.receiver_mobile);
    setOriginalReceiverMobile(existingBill.receiver_mobile);
    setStoredReceiverCopy(receiverCopyFromBill(existingBill));
    setDiscountPercent(String(existingBill.discount_percent));
    setLines(
      existingBill.lines.length > 0
        ? existingBill.lines.map((line) => ({
            bill_line_id: line.bill_line_id,
            product_id: line.product_id,
            tax_code_id: line.tax_code_id,
            loaded_product_id: line.product_id,
            stored_product_name: line.product_name,
            loaded_tax_code_id: line.tax_code_id,
            stored_tax_code: line.tax_code,
            quantity: String(line.quantity),
            rate: String(line.rate),
            cgst_percent: line.cgst_percent,
            sgst_percent: line.sgst_percent,
            igst_percent: line.igst_percent,
            product_chosen_again: false,
          }))
        : [emptyLine()]
    );
    setFormHydrated(true);
  }, [existingBill, formHydrated]);

  const receiverDisplay = useMemo(() => {
    if (
      isEdit &&
      storedReceiverCopy &&
      receiverMobile === originalReceiverMobile
    ) {
      return storedReceiverCopy;
    }
    const client = clients.find((c) => c.mobile === receiverMobile);
    if (!client) {
      return null;
    }
    return {
      name: client.name,
      address: client.address ?? "",
      gst_number: client.gst_number ?? "",
      contact_person: client.contact_person ?? "",
      contact_number: client.contact_number ?? "",
    };
  }, [clients, isEdit, originalReceiverMobile, receiverMobile, storedReceiverCopy]);

  const productOptions = useMemo(() => {
    const catalog = products.filter((p) => p.tax_code_id);
    return catalog.map((p) => ({
      value: p.product_id,
      label: p.product_name,
      wholesale_price: p.wholesale_price,
      tax_code_id: p.tax_code_id,
    }));
  }, [products]);

  const clientOptions = useMemo(() => {
    const options = clients.map((c) => ({ value: c.mobile, label: c.name }));
    if (!isEdit || !originalReceiverMobile || !storedReceiverCopy) {
      return options;
    }
    const storedLabel = storedReceiverCopy.name;
    const index = options.findIndex((o) => o.value === originalReceiverMobile);
    if (receiverMobile === originalReceiverMobile) {
      if (index >= 0) {
        options[index] = { ...options[index], label: storedLabel };
      } else {
        options.unshift({ value: originalReceiverMobile, label: storedLabel });
      }
    } else if (index < 0) {
      options.unshift({ value: originalReceiverMobile, label: storedLabel });
    }
    return options;
  }, [clients, isEdit, originalReceiverMobile, receiverMobile, storedReceiverCopy]);

  useEffect(() => {
    if (!activeCollection) {
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await previewGstBillTotals(activeCollection, {
          discount_percent: discountPercent,
          lines: lines.map((line) => ({
            product_id: line.product_id || undefined,
            tax_code_id: line.tax_code_id || undefined,
            quantity: line.quantity,
            rate: line.rate,
            cgst_percent: line.cgst_percent,
            sgst_percent: line.sgst_percent,
            igst_percent: line.igst_percent,
          })),
        });
        setPreview(response.data.totals);
        setPreviewError(null);
      } catch (err) {
        setPreview(null);
        setPreviewError(err?.response?.data?.message ?? null);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [activeCollection, lines, discountPercent]);

  const buildSavePayload = () => ({
    bill_number_parts: billNumberParts,
    bill_date: billDate,
    receiver_mobile: receiverMobile,
    discount_percent: discountPercent,
    lines: lines.map((line) => ({
      bill_line_id: line.bill_line_id || undefined,
      product_id: line.product_id,
      tax_code_id: line.tax_code_id,
      quantity: line.quantity,
      rate: line.rate,
      cgst_percent: line.cgst_percent,
      sgst_percent: line.sgst_percent,
      igst_percent: line.igst_percent,
      ...(line.product_chosen_again ? { product_chosen_again: true } : {}),
    })),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildSavePayload();
      const response = isEdit
        ? await updateGstBill(activeCollection, billId, payload)
        : await createGstBill(activeCollection, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gst-bills", activeCollection] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ["gst-bill", activeCollection, billId] });
      }
      toast.success("Bill saved");
      navigate("/bills");
    },
    onError: (err) => {
      const message = err?.response?.data?.message || "Failed to save bill";
      err.message = message;
      toast.error(message);
    },
  });

  const updateLine = (index, patch) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
    setValidationErrors((prev) => {
      if (!prev?.lines?.[index]) {
        return prev;
      }
      return {
        ...prev,
        lines: prev.lines.map((lineErrors, i) =>
          i === index ? emptyLineFieldErrors() : lineErrors
        ),
      };
    });
  };

  const onCgstPercentChange = (index, rawValue) => {
    const patch = { cgst_percent: rawValue, sgst_percent: rawValue };
    const amount = Number(String(rawValue).trim());
    if (rawValue !== "" && Number.isFinite(amount) && amount > 0) {
      patch.igst_percent = 0;
    }
    updateLine(index, patch);
  };

  const onSgstPercentChange = (index, rawValue) => {
    onCgstPercentChange(index, rawValue);
  };

  const onIgstPercentChange = (index, rawValue) => {
    const patch = { igst_percent: rawValue };
    const amount = Number(String(rawValue).trim());
    if (rawValue !== "" && Number.isFinite(amount) && amount > 0) {
      patch.cgst_percent = 0;
      patch.sgst_percent = 0;
    }
    updateLine(index, patch);
  };

  const attemptSave = () => {
    const { hasError, errors } = validateGstBillForm({
      billNumberParts,
      billDate,
      receiverMobile,
      discountPercent,
      lines,
      clients,
    });
    setValidationErrors(errors);
    if (hasError) {
      toast.error("Fix the highlighted fields before saving");
      return;
    }
    if (
      !canSubmitGstBill({
        hasCompleteLine,
        preview,
        previewError,
        discountPercent,
      })
    ) {
      toast.error(previewError || "Check line amounts and discount before saving");
      return;
    }
    saveMutation.mutate();
  };

  const onProductChange = (index, option) => {
    if (!option) {
      updateLine(index, {
        product_id: "",
        rate: "",
        tax_code_id: "",
        cgst_percent: 0,
        sgst_percent: 0,
        igst_percent: 0,
        loaded_product_id: "",
        stored_product_name: "",
        product_chosen_again: false,
      });
      return;
    }
    const patch = {
      product_id: option.value,
      rate: String(option.wholesale_price ?? ""),
      ...taxCodeFieldsFromProduct(option, taxCodes),
      ...(isEdit ? { product_chosen_again: true } : {}),
    };
    updateLine(index, patch);
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine()]);
    setValidationErrors(null);
  };

  const removeLine = (index) => {
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [emptyLine()] : next;
    });
    setValidationErrors(null);
  };

  const lineDisplay = (index) => {
    const computed = preview?.line_previews?.[index];
    const line = lines[index];
    let price = "";
    if (isCompleteLine(line)) {
      const qty = Number(line.quantity);
      const rate = Number(line.rate);
      if (Number.isFinite(qty) && Number.isFinite(rate)) {
        price = formatAmount(Math.round((qty * rate + Number.EPSILON) * 100) / 100);
      }
    }
    return {
      price,
      cgst_amount: computed ? formatAmount(computed.cgst_amount) : "",
      sgst_amount: computed ? formatAmount(computed.sgst_amount) : "",
      igst_amount: computed ? formatAmount(computed.igst_amount) : "",
      line_total: computed ? formatAmount(computed.line_total) : "",
    };
  };

  const isLoading =
    productsLoading || taxCodesLoading || clientsLoading || (isEdit && billLoading);
  const queryError = productsError || taxCodesError || clientsError || billError;
  const formReady = !isEdit || formHydrated;
  const hasCompleteLine = lines.some(isCompleteLine);
  const showFooterTotals = preview && hasCompleteLine;

  return (
    <div>
      <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
        <div className="text-xl text-foreground font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/bills", label: "Bills" },
              { path: isEdit ? `/bills/edit/${billId}` : "/bills/new", label: isEdit ? "Edit" : "Add" },
            ]}
          />
        </div>
      </div>

      {!activeCollection ? (
        <div className="px-5 text-muted-foreground">Choose a collection before raising a bill.</div>
      ) : isLoading || !formReady ? (
        <div className="flex justify-center items-center h-64">
          <div className="basic-loader"></div>
        </div>
      ) : queryError ? (
        <QueryError error={queryError} />
      ) : (
        <div className="px-5 space-y-6 pb-10">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium whitespace-nowrap">
                Bill number <RequiredMark />
              </label>
              <div className="flex gap-2 mt-1">
                {billNumberParts.map((part, index) => (
                  <Input
                    key={index}
                    value={part}
                    maxLength={20}
                    className={cn(
                      validationErrors?.billNumberParts?.[index] && invalidInputClass
                    )}
                    onChange={(e) => {
                      const next = [...billNumberParts];
                      next[index] = e.target.value;
                      setBillNumberParts(next);
                      setValidationErrors((prev) => {
                        if (!prev?.billNumberParts?.[index]) {
                          return prev;
                        }
                        const billNumberPartsErrors = [...prev.billNumberParts];
                        billNumberPartsErrors[index] = null;
                        return { ...prev, billNumberParts: billNumberPartsErrors };
                      });
                    }}
                  />
                ))}
              </div>
              {validationErrors?.billNumberParts?.some(Boolean) ? (
                <FieldError
                  message={
                    validationErrors.billNumberParts.find(Boolean) ??
                    "Bill number is incomplete"
                  }
                />
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium">
                Date <RequiredMark />
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatBillCalendarDate(billDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={billCalendarDateToLocalDate(billDate) ?? undefined}
                    onSelect={(date) => {
                      if (date) {
                        setBillDate(localDateToBillCalendarIso(date));
                        setValidationErrors((prev) =>
                          prev ? { ...prev, billDate: null } : prev
                        );
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FieldError message={validationErrors?.billDate} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">
                Receiver (Bill to) <RequiredMark />
              </label>
              <ReactSelect
                className={cn(
                  "mt-1",
                  validationErrors?.receiver && "[&_.select__control]:border-destructive"
                )}
                options={clientOptions}
                value={clientOptions.find((o) => o.value === receiverMobile) ?? null}
                onChange={(option) => {
                  setReceiverMobile(option?.value ?? "");
                  setValidationErrors((prev) =>
                    prev ? { ...prev, receiver: null } : prev
                  );
                }}
                placeholder="Select client"
                {...billSelectProps}
              />
              <FieldError message={validationErrors?.receiver} />
            </div>
            <div className="space-y-2">
              <Textarea readOnly value={receiverDisplay?.address ?? ""} placeholder="Address" />
              <Input readOnly value={receiverDisplay?.gst_number ?? ""} placeholder="GST number" />
              <div className="grid grid-cols-2 gap-2">
                <Input readOnly value={receiverDisplay?.contact_person ?? ""} placeholder="Contact person" />
                <Input readOnly value={receiverDisplay?.contact_number ?? ""} placeholder="Contact number" />
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            <RequiredMark /> Filled lines need product, qty, rate, CGST %, and SGST %.
          </p>

          <div className="rounded-lg border bg-card shadow-sm">
              <Table className="min-w-[1040px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead colSpan={5} className="h-9 py-2 text-xs font-semibold uppercase tracking-wide">
                      Product &amp; price
                    </TableHead>
                    <TableHead
                      colSpan={6}
                      className={cn(
                        "h-9 py-2 text-center text-xs font-semibold uppercase tracking-wide",
                        taxSectionClass
                      )}
                    >
                      Tax
                    </TableHead>
                    <TableHead colSpan={2} className="h-9 py-2" />
                  </TableRow>
                  <TableRow className="hover:bg-transparent bg-muted/40">
                    <TableHead className="h-10 min-w-[11rem] p-2 text-xs whitespace-nowrap">
                      Description
                    </TableHead>
                    <TableHead className="h-10 min-w-[9rem] p-2 text-xs whitespace-nowrap">
                      HSN/SAC
                    </TableHead>
                    <TableHead className="h-10 w-16 p-2 text-center text-xs whitespace-nowrap">
                      Qty
                    </TableHead>
                    <TableHead className="h-10 w-24 p-2 text-right text-xs whitespace-nowrap">
                      Rate
                    </TableHead>
                    <TableHead className="h-10 w-28 p-2 text-right text-xs whitespace-nowrap">
                      Price
                    </TableHead>
                    <TableHead
                      className={cn(
                        "h-10 w-14 p-2 text-center text-xs whitespace-nowrap",
                        taxSectionClass
                      )}
                    >
                      CGST %
                    </TableHead>
                    <TableHead className="h-10 w-24 p-2 text-right text-xs whitespace-nowrap">
                      CGST
                    </TableHead>
                    <TableHead className="h-10 w-14 p-2 text-center text-xs whitespace-nowrap">
                      SGST %
                    </TableHead>
                    <TableHead className="h-10 w-24 p-2 text-right text-xs">SGST</TableHead>
                    <TableHead className="h-10 w-14 p-2 text-center text-xs">IGST %</TableHead>
                    <TableHead className="h-10 w-24 p-2 text-right text-xs">IGST</TableHead>
                    <TableHead className="h-10 w-28 p-2 text-right text-xs font-medium">Line total</TableHead>
                    <TableHead className="h-10 w-10 p-2" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line, index) => {
                    const display = lineDisplay(index);
                    const rowProductOptions = productOptionsForLine(line, productOptions, isEdit);
                    const lineErrors = validationErrors?.lines?.[index];
                    const lineErrorSummary = summarizeLineErrors(lineErrors);
                    const lineRowKey = line.bill_line_id || `line-${index}`;
                    const productInvalid =
                      lineErrors?.product || lineErrors?.line;
                    return (
                      <Fragment key={lineRowKey}>
                      <TableRow className="hover:bg-muted/30">
                        <TableCell className="p-2 align-middle">
                          <ReactSelect
                            className={cn(
                              productInvalid && "[&_.select__control]:border-destructive"
                            )}
                            options={rowProductOptions}
                            value={
                              rowProductOptions.find((o) => o.value === line.product_id) ?? null
                            }
                            onChange={(option) => onProductChange(index, option)}
                            placeholder="Product"
                            components={productSelectComponentsForReselect(line.product_id, (option) =>
                              onProductChange(index, option)
                            )}
                            {...billSelectProps}
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Input
                            readOnly
                            tabIndex={-1}
                            value={hsnSacDisplayForLine(line, taxCodes)}
                            placeholder="HSN/SAC"
                            title={hsnSacDisplayForLine(line, taxCodes)}
                            className={cn(
                              compactInputClass,
                              "w-full min-w-[8.5rem]",
                              "cursor-default border-input bg-muted/25 shadow-none",
                              "focus-visible:border-input focus-visible:ring-0 focus-visible:ring-offset-0"
                            )}
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Input
                            className={cn(
                              compactInputClass,
                              "w-16 text-center",
                              lineErrors?.quantity && invalidInputClass
                            )}
                            value={line.quantity}
                            onChange={(e) => updateLine(index, { quantity: e.target.value })}
                            inputMode="numeric"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Input
                            className={cn(
                              compactInputClass,
                              "text-right",
                              lineErrors?.rate && invalidInputClass
                            )}
                            value={line.rate}
                            onChange={(e) => updateLine(index, { rate: e.target.value })}
                            inputMode="decimal"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <ReadonlyAmount value={display.price} />
                        </TableCell>
                        <TableCell className={cn("p-2 align-middle", taxSectionClass)}>
                          <Input
                            className={cn(
                              percentInputClass,
                              (lineErrors?.cgst || lineErrors?.tax) && invalidInputClass
                            )}
                            value={line.cgst_percent}
                            onChange={(e) => onCgstPercentChange(index, e.target.value)}
                            inputMode="decimal"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <ReadonlyAmount value={display.cgst_amount} />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Input
                            className={cn(
                              percentInputClass,
                              (lineErrors?.sgst || lineErrors?.tax) && invalidInputClass
                            )}
                            value={line.sgst_percent}
                            onChange={(e) => onSgstPercentChange(index, e.target.value)}
                            inputMode="decimal"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <ReadonlyAmount value={display.sgst_amount} />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Input
                            className={cn(
                              percentInputClass,
                              lineErrors?.igst && invalidInputClass
                            )}
                            value={line.igst_percent}
                            onChange={(e) => onIgstPercentChange(index, e.target.value)}
                            inputMode="decimal"
                          />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <ReadonlyAmount value={display.igst_amount} />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <ReadonlyAmount value={display.line_total} />
                        </TableCell>
                        <TableCell className="p-2 align-middle">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLine(index)}
                            aria-label="Remove line"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      {lineErrorSummary ? (
                        <TableRow className="hover:bg-transparent border-b border-border/80">
                          <TableCell
                            colSpan={LINE_TABLE_COLUMN_COUNT}
                            className="py-1.5 px-3 bg-destructive/5"
                          >
                            <p className="text-xs text-destructive">{lineErrorSummary}</p>
                          </TableCell>
                        </TableRow>
                      ) : null}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addLine}>
            <Plus className="size-4 mr-1" />
            Add New Item
          </Button>

          <div className="border-t pt-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="w-full max-w-[12rem]">
              <label className="text-sm font-medium">
                Discount(%) <RequiredMark />
              </label>
              <Input
                className={cn(
                  "mt-1",
                  validationErrors?.discountPercent && invalidInputClass
                )}
                value={discountPercent}
                onChange={(e) => {
                  setDiscountPercent(e.target.value);
                  setValidationErrors((prev) =>
                    prev ? { ...prev, discountPercent: null } : prev
                  );
                }}
              />
              <FieldError message={validationErrors?.discountPercent} />
            </div>
            <div className="w-full max-w-md rounded-lg border bg-muted/30 p-4 shadow-sm">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total value</span>
                  <span className="font-medium tabular-nums">
                    {showFooterTotals ? formatAmount(preview.total_value) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Total tax</span>
                  <span className="font-medium tabular-nums">
                    {showFooterTotals ? formatAmount(preview.total_tax) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border pt-3 mt-1">
                  <span className="font-semibold text-base">Total bill</span>
                  <span className="font-semibold text-lg tabular-nums text-indigo-600 dark:text-indigo-400">
                    {showFooterTotals ? formatAmount(preview.total_bill) : "—"}
                  </span>
                </div>
              </div>
              {previewError && (
                <p className="text-sm text-destructive mt-3">{previewError}</p>
              )}
            </div>
          </div>

          {validationErrors?.general ? (
            <p className="text-sm text-destructive">{validationErrors.general}</p>
          ) : null}
          <MutationError mutation={saveMutation} />
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate("/bills")}>Cancel</Button>
            <Button
              variant="indigo"
              disabled={saveMutation.isPending}
              onClick={attemptSave}
            >
              Final Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GstBillForm;
