import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { CircleAlert, Loader2, ScanLine } from "lucide-react";
import { toast } from "react-toastify";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import FormatePrice from "@/helper/FormatPrice";
import { cn } from "@/lib/utils";
import { getBillById, updateBillDeliveryStatus, updateBillPaymentStatus } from "@/services/bills";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RESET_GAP_MS = 120;

const isEditableElement = (target) => {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tagName = target.tagName;
    return target.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
};

const clearScannedTextFromEditableTarget = (target, scannedValue) => {
    if (!target || typeof target.value !== "string") {
        return;
    }

    if (!target.value.endsWith(scannedValue)) {
        return;
    }

    target.value = target.value.slice(0, -scannedValue.length);
    target.dispatchEvent(new Event("input", { bubbles: true }));
};

const getScannerLabel = (scannerState) => {
    switch (scannerState) {
        case "capturing":
            return "Reading";
        case "loading":
            return "Checking";
        case "error":
            return "Retry";
        default:
            return "Ready";
    }
};

const getBillDialogCopy = ({ isBillPaid, isBillDelivered }) => {
    if (isBillDelivered) {
        return {
            title: "Bill already delivered",
            description: "This bill is already delivered and settled. You can close this dialog and continue scanning.",
        };
    }

    if (isBillPaid) {
        return {
            title: "Bill paid, waiting for delivery",
            description: "This bill is already paid. You can mark it as delivered from here.",
        };
    }

    return {
        title: "Update scanned bill status",
        description: "You can mark this bill as paid only, or mark it as delivered which will also settle the payment.",
    };
};

const BillScanner = () => {
    const queryClient = useQueryClient();
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const [manualValue, setManualValue] = useState("");
    const [scannerState, setScannerState] = useState("ready");
    const [modalData, setModalData] = useState({ open: false, bill: null });
    const scanBufferRef = useRef({ value: "", startedAt: 0, lastKeyAt: 0, target: null });

    const resetScanBuffer = () => {
        scanBufferRef.current = { value: "", startedAt: 0, lastKeyAt: 0, target: null };
    };

    const lookupBillMutation = useMutation({
        mutationFn: ({ collection_id, bill_id }) => getBillById({ collection_id, bill_id }),
        onMutate: () => {
            setScannerState("loading");
        },
        onSuccess: (response) => {
            setModalData({ open: true, bill: response.data?.bill || null });
            setManualValue("");
            setScannerState("ready");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Bill not found for scanned code";
            toast.error(message);
            setScannerState("error");
        },
    });

    const markBillAsPaidMutation = useMutation({
        mutationFn: ({ collection_id, bill_id }) => updateBillPaymentStatus({
            collection_id,
            bill_id,
            data: { mark_as_paid: true },
        }),
        onSuccess: (response) => {
            const updatedBill = response.data?.bill || null;

            setModalData((current) => ({
                ...current,
                bill: updatedBill,
            }));

            toast.success(response.data?.message || "Bill marked as paid successfully");
            queryClient.invalidateQueries({ queryKey: ["bills", activeCollection] });
            setScannerState("ready");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Unable to mark bill as paid";
            toast.error(message);
            setScannerState("error");
        },
    });

    const markBillAsDeliveredMutation = useMutation({
        mutationFn: ({ collection_id, bill_id }) => updateBillDeliveryStatus({
            collection_id,
            bill_id,
            data: { is_delivered: true },
        }),
        onSuccess: (response) => {
            const updatedBill = response.data?.bill || null;

            setModalData((current) => ({
                ...current,
                bill: updatedBill,
            }));

            toast.success(response.data?.message || "Bill marked as delivered successfully");
            queryClient.invalidateQueries({ queryKey: ["bills", activeCollection] });
            setScannerState("ready");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Unable to mark bill as delivered";
            toast.error(message);
            setScannerState("error");
        },
    });

    const handleLookup = useCallback((billId) => {
        const normalizedBillId = String(billId || "").trim();

        if (!activeCollection) {
            toast.error("Select a collection before scanning bills");
            setScannerState("error");
            return;
        }

        if (!UUID_REGEX.test(normalizedBillId)) {
            toast.error("Invalid bill QR code");
            setScannerState("error");
            return;
        }

        lookupBillMutation.mutate({ collection_id: activeCollection, bill_id: normalizedBillId });
    }, [activeCollection, lookupBillMutation]);

    const handleManualSubmit = (event) => {
        event.preventDefault();
        handleLookup(manualValue);
    };

    useEffect(() => {
        if (scannerState === "capturing") {
            const timeoutId = window.setTimeout(() => setScannerState("ready"), 240);
            return () => window.clearTimeout(timeoutId);
        }

        if (scannerState === "error") {
            const timeoutId = window.setTimeout(() => setScannerState("ready"), 1200);
            return () => window.clearTimeout(timeoutId);
        }
    }, [scannerState]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Process" || event.ctrlKey || event.metaKey || event.altKey) {
                return;
            }

            if (lookupBillMutation.isPending || markBillAsPaidMutation.isPending || markBillAsDeliveredMutation.isPending) {
                return;
            }

            const now = Date.now();
            const buffer = scanBufferRef.current;

            if (event.key === "Escape") {
                resetScanBuffer();
                return;
            }

            if (event.key === "Enter") {
                const scannedValue = buffer.value.trim();
                const eventTarget = buffer.target;
                resetScanBuffer();

                if (!scannedValue || !UUID_REGEX.test(scannedValue)) {
                    return;
                }

                if (isEditableElement(eventTarget)) {
                    clearScannedTextFromEditableTarget(eventTarget, scannedValue);
                }

                event.preventDefault();
                handleLookup(scannedValue);
                return;
            }

            if (event.key.length !== 1) {
                return;
            }

            const shouldReset = now - buffer.lastKeyAt > RESET_GAP_MS;

            if (shouldReset) {
                scanBufferRef.current = {
                    value: event.key,
                    startedAt: now,
                    lastKeyAt: now,
                    target: event.target,
                };
            } else {
                scanBufferRef.current = {
                    ...buffer,
                    value: `${buffer.value}${event.key}`,
                    lastKeyAt: now,
                    target: buffer.target || event.target,
                };
            }

            if (scanBufferRef.current.value.length > 64) {
                resetScanBuffer();
                return;
            }

            if (scanBufferRef.current.value.length >= 8) {
                setScannerState("capturing");
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [handleLookup, lookupBillMutation.isPending, markBillAsPaidMutation.isPending, markBillAsDeliveredMutation.isPending]);

    const scannedBill = modalData.bill;
    const isBillPaid = Number(scannedBill?.total_due || 0) <= 0;
    const isBillDelivered = Boolean(scannedBill?.delivered_at);
    const dialogCopy = getBillDialogCopy({ isBillPaid, isBillDelivered });
    const isUpdatingStatus = markBillAsPaidMutation.isPending || markBillAsDeliveredMutation.isPending;

    return (
        <>
            <AlertDialog
                open={modalData.open}
                onOpenChange={(value) => {
                    if (!value) {
                        setModalData({ open: false, bill: null });
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {dialogCopy.title}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {dialogCopy.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {scannedBill && (
                        <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">Bill No</span>
                                <span>{scannedBill.bill_no}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">Client</span>
                                <span>{scannedBill.name}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">Mobile</span>
                                <span>{scannedBill.mobile}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">Payment</span>
                                <span className={cn("font-semibold", isBillPaid ? "text-green-600" : "text-red-600")}>
                                    {isBillPaid ? "Paid" : <FormatePrice price={scannedBill.total_due} />}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">Delivery</span>
                                <span className={cn("font-semibold", isBillDelivered ? "text-green-600" : "text-amber-600")}>
                                    {isBillDelivered ? "Delivered" : "Pending"}
                                </span>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                        {!isBillPaid && (
                            <AlertDialogAction
                                onClick={(event) => {
                                    event.preventDefault();
                                    markBillAsPaidMutation.mutate({
                                        collection_id: activeCollection,
                                        bill_id: scannedBill.bill_id,
                                    });
                                }}
                                disabled={isUpdatingStatus}
                            >
                                {markBillAsPaidMutation.isPending ? "Updating..." : "Mark as paid"}
                            </AlertDialogAction>
                        )}
                        {!isBillDelivered && (
                            <Button
                                type="button"
                                variant="indigo"
                                size="sm"
                                onClick={() => {
                                    markBillAsDeliveredMutation.mutate({
                                        collection_id: activeCollection,
                                        bill_id: scannedBill.bill_id,
                                    });
                                }}
                                isLoading={markBillAsDeliveredMutation.isPending}
                                loadingText="Updating..."
                                disabled={isUpdatingStatus}
                            >
                                Mark as delivered
                            </Button>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <form onSubmit={handleManualSubmit} className="hidden items-center gap-2 xl:flex">
                <div className="relative">
                    <ScanLine className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                        value={manualValue}
                        onChange={(event) => setManualValue(event.target.value)}
                        placeholder="Scan or paste bill code"
                        className="h-9 w-56 pl-8"
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!manualValue.trim() || lookupBillMutation.isPending}
                >
                    {lookupBillMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Find"}
                </Button>
            </form>

            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                <span
                    className={cn(
                        "size-2 rounded-full",
                        scannerState === "ready" && "bg-green-500",
                        scannerState === "capturing" && "bg-amber-400",
                        scannerState === "loading" && "bg-blue-500",
                        scannerState === "error" && "bg-red-500"
                    )}
                />
                <span>Scanner {getScannerLabel(scannerState)}</span>
                {!activeCollection && <CircleAlert className="size-3.5 text-amber-500" />}
            </div>
        </>
    );
};

export default BillScanner;