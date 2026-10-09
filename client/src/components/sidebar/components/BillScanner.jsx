import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { CircleAlert, ScanLine } from "lucide-react";
import { toast } from "react-toastify";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import FormatePrice from "@/helper/FormatPrice";
import { cn } from "@/lib/utils";
import { getOrderById, updateOrderDeliveryStatus, updateOrderPaymentStatus } from "@/services/orders";
import { EDIT_LOCK_REASON, isBillLockedForEditing } from "@/lib/whatsappDelivery";
import { BILL_NUMBER_LABEL } from "@jakkash/bill-pdf";

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

const getScannerStatus = (scannerState) => {
    switch (scannerState) {
        case "capturing":
            return { label: "Reading", dot: "bg-amber-500 animate-pulse", icon: "text-amber-500" };
        case "loading":
            return { label: "Checking", dot: "bg-primary animate-pulse", icon: "text-primary" };
        case "error":
            return { label: "Retry", dot: "bg-destructive", icon: "text-destructive" };
        default:
            return { label: "Ready", dot: "bg-green-500", icon: "text-muted-foreground" };
    }
};

const getBillDialogCopy = ({ isBillPaid, isBillDelivered }) => {
    if (isBillDelivered) {
        return {
            title: "Order already delivered",
            description: "this order is already delivered and settled. You can close this dialog and continue scanning.",
        };
    }

    if (isBillPaid) {
        return {
            title: "Order paid, waiting for delivery",
            description: "this order is already paid. You can mark it as delivered from here.",
        };
    }

    return {
        title: "Update scanned order status",
        description: "You can mark this order as paid only, or mark it as delivered which will also settle the payment.",
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
        mutationFn: ({ collection_id, order_id }) => getOrderById({ collection_id, order_id }),
        onMutate: () => {
            setScannerState("loading");
        },
        onSuccess: (response) => {
            setModalData({ open: true, bill: response.data?.order || null });
            setManualValue("");
            setScannerState("ready");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Order not found for scanned code";
            toast.error(message);
            setScannerState("error");
        },
    });

    const markBillAsPaidMutation = useMutation({
        mutationFn: ({ collection_id, order_id }) => updateOrderPaymentStatus({
            collection_id,
            order_id,
            data: { mark_as_paid: true },
        }),
        onSuccess: (response) => {
            const updatedOrder = response.data?.order || null;

            setModalData((current) => ({
                ...current,
                bill: updatedOrder,
            }));

            toast.success(response.data?.message || "Order marked as paid successfully");
            queryClient.invalidateQueries({ queryKey: ["orders", activeCollection] });
            setScannerState("ready");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Unable to mark order as paid";
            toast.error(message);
            setScannerState("error");
        },
    });

    const markBillAsDeliveredMutation = useMutation({
        mutationFn: ({ collection_id, order_id }) => updateOrderDeliveryStatus({
            collection_id,
            order_id,
            data: { is_delivered: true },
        }),
        onSuccess: (response) => {
            const updatedOrder = response.data?.order || null;

            setModalData((current) => ({
                ...current,
                bill: updatedOrder,
            }));

            toast.success(response.data?.message || "Order marked as delivered successfully");
            queryClient.invalidateQueries({ queryKey: ["orders", activeCollection] });
            setScannerState("ready");
        },
        onError: (error) => {
            const message = error?.response?.data?.message || "Unable to mark order as delivered";
            toast.error(message);
            setScannerState("error");
        },
    });

    const handleLookup = useCallback((billId) => {
        const normalizedBillId = String(billId || "").trim();

        if (!activeCollection) {
            toast.error("Select a collection before scanning orders");
            setScannerState("error");
            return;
        }

        if (!UUID_REGEX.test(normalizedBillId)) {
            toast.error("Invalid order QR code");
            setScannerState("error");
            return;
        }

        lookupBillMutation.mutate({ collection_id: activeCollection, order_id: normalizedBillId });
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
    // Both actions rewrite advance/total_due, which are printed on the order PDF,
    // so a delivery in flight locks them exactly like a normal edit (ADR 0005).
    const isBillLocked = isBillLockedForEditing(scannedBill);
    const scannerStatus = getScannerStatus(scannerState);

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
                        <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-foreground">
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">{BILL_NUMBER_LABEL}</span>
                                <span>{scannedBill.order_no}</span>
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
                                <span className={cn("font-semibold", isBillPaid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                                    {isBillPaid ? "Paid" : <FormatePrice price={scannedBill.total_due} />}
                                </span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span className="font-medium">Delivery</span>
                                <span className={cn("font-semibold", isBillDelivered ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400")}>
                                    {isBillDelivered ? "Delivered" : "Pending"}
                                </span>
                            </div>
                        </div>
                    )}

                    {isBillLocked && (
                        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-muted-foreground">
                            {EDIT_LOCK_REASON}
                        </p>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                        {!isBillPaid && (
                            <AlertDialogAction
                                onClick={(event) => {
                                    event.preventDefault();
                                    markBillAsPaidMutation.mutate({
                                        collection_id: activeCollection,
                                        order_id: scannedBill.order_id,
                                    });
                                }}
                                disabled={isUpdatingStatus || isBillLocked}
                                title={isBillLocked ? EDIT_LOCK_REASON : undefined}
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
                                        order_id: scannedBill.order_id,
                                    });
                                }}
                                isLoading={markBillAsDeliveredMutation.isPending}
                                loadingText="Updating..."
                                disabled={isUpdatingStatus || isBillLocked}
                                title={isBillLocked ? EDIT_LOCK_REASON : undefined}
                            >
                                Mark as delivered
                            </Button>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <form onSubmit={handleManualSubmit} className="hidden md:flex items-center gap-2">
                <div className="relative">
                    <ScanLine
                        className={cn(
                            "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2",
                            scannerStatus.icon
                        )}
                    />
                    <input
                        value={manualValue}
                        onChange={(event) => setManualValue(event.target.value)}
                        placeholder="Scan or paste order code"
                        className="h-9 w-48 rounded-lg border border-border bg-background py-0 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring lg:w-56 xl:w-64"
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    disabled={!manualValue.trim()}
                    isLoading={lookupBillMutation.isPending}
                    loadingText="Finding..."
                    className="h-9 px-3.5"
                >
                    Find
                </Button>
                <div
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    title={!activeCollection ? "Select a collection before scanning" : undefined}
                >
                    <span className={cn("size-1.5 rounded-full", scannerStatus.dot)} />
                    <span className="hidden lg:inline">{scannerStatus.label}</span>
                    {!activeCollection && <CircleAlert className="size-3.5 text-amber-500" />}
                </div>
            </form>
        </>
    );
};

export default BillScanner;