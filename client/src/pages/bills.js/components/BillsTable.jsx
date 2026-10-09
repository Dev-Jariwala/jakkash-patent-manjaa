import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, } from "@tanstack/react-table";
import { useEffect, useMemo, useRef, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight, } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Eye, Lock, Pencil } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { getOrdersByCollectionId, getWholesaleOrdersCsvReport, updateOrderDeliveryStatus } from "@/services/orders";
import { toast } from "react-toastify";
import { format, formatDate } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BillsPdfModal from "./BillsPdfModal";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { CSVLink } from "react-csv";
import { Spinner } from "@/components/ui/spinner";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import FormatePrice from "@/helper/FormatPrice";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import WhatsAppCancelAction from "@/components/bills/WhatsAppCancelAction";
import WhatsAppDeliveryStatus from "@/components/bills/WhatsAppDeliveryStatus";
import WhatsAppResendAction from "@/components/bills/WhatsAppResendAction";
import { billHasProcessingWhatsAppDelivery, EDIT_LOCK_REASON, getWhatsAppDeliveryPollIntervalMs, isBillLockedForEditing } from "@/lib/whatsappDelivery";
import { BILL_NUMBER_LABEL } from "@jakkash/bill-pdf";

const csvHeaders = [
    { label: `${BILL_NUMBER_LABEL}.`, key: "order_no" },
    { label: "Name", key: "name" },
    { label: "Total Firki", key: "total_firki" },
    { label: "Mobile", key: "mobile" },
    { label: "Address", key: "address" },
    { label: "Order Date", key: "order_date" },
    { label: "Delivery Date", key: "delivery_date" },
    { label: "Sub Total", key: "sub_total" },
    { label: "Discount", key: "discount" },
    { label: "Advance", key: "advance" },
    { label: "Total Due", key: "total_due" },
];

// eslint-disable-next-line react/prop-types
const BillsTable = () => {
    const queryClient = useQueryClient();
    const { orderType } = useParams();
    const navigate = useNavigate();
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5, });
    const [columnVisibility, setColumnVisibility] = useState({
        order_no: true,
        order_date: true,
        delivery_date: false,
        name: true,
        mobile: false,
        address: false,
        total_firki: false,
        sub_total: true,
        discount: false,
        advance: false,
        total_due: true,
        whatsapp_delivery_status: true,
    });
    const [showDeliveryAlert, setShowDeliveryAlert] = useState({ status: false, data: null });
    const [columnOrder, setColumnOrder] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [searchParams] = useSearchParams();
    const order_id = searchParams.get("order_id");

    const whatsappPollIntervalMs = getWhatsAppDeliveryPollIntervalMs();

    const { data: ordersData, error: ordersDataError, isLoading: isOrdersDataLoading } = useQuery({
        queryKey: ["orders", activeCollection, pagination, debouncedSearch, orderType],
        queryFn: async () => {
            const response = await getOrdersByCollectionId({ activeCollection, pagination, debouncedSearch, order_type: orderType });
            return response.data;
        },
        enabled: !!activeCollection,
        refetchInterval: (query) =>
            billHasProcessingWhatsAppDelivery(query.state.data?.orders)
                ? whatsappPollIntervalMs
                : false,
    });

    const { data: wholesaleBills, error: wholesaleBillsError, isLoading: isWholesaleBillsLoading, refetch } = useQuery({
        queryKey: ["wholesaleBills", activeCollection],
        queryFn: async () => {
            const response = await getWholesaleOrdersCsvReport({ collection_id: activeCollection });
            return response.data?.wholesale_orders?.map(bill => {
                return {
                    ...bill,
                    order_date: format(new Date(bill.order_date), "dd/MM/yyyy"),
                    delivery_date: format(new Date(bill.delivery_date), "dd/MM/yyyy"),
                }
            }) || [];
        },
        enabled: false
    });
    const csvLinkRef = useRef(null);
    const csvDownloadReady = useRef(false);
    const [csvDownloadTick, setCsvDownloadTick] = useState(0);

    useEffect(() => {
        if (!csvDownloadReady.current) return;
        csvLinkRef.current?.link?.click();
    }, [csvDownloadTick]);

    const columnHelper = createColumnHelper();
    const columnsDef = useMemo(() => (
        [
            columnHelper.accessor("order_no", {
                header: BILL_NUMBER_LABEL,
            }),
            columnHelper.accessor("order_date", {
                header: "Order Date",
                cell: (info) => {
                    return info.getValue() ? format(new Date(info.getValue()), "dd/MM/yyyy") : "-";
                }
            }),
            columnHelper.accessor("delivery_date", {
                header: "Delivery Date",
                cell: (info) => {
                    return info.getValue() ? format(new Date(info.getValue()), "dd/MM/yyyy") : "-";
                }
            }),
            columnHelper.accessor("name", {
                header: "Client Name",
            }),
            columnHelper.accessor('mobile', {
                header: "Mobile",
            }),
            columnHelper.accessor("address", {
                header: "Address",
            }),
            columnHelper.accessor("total_firki", {
                header: "Total Firki",
            }),
            columnHelper.accessor("sub_total", {
                header: "Total",
                cell: (info) => {
                    return <FormatePrice price={info.getValue()} />;
                }
            }),
            columnHelper.accessor('discount', {
                header: "Discount",
                cell: (info) => {
                    return <FormatePrice price={info.getValue()} />;
                }
            }),
            columnHelper.accessor("advance", {
                header: "Advance",
                cell: (info) => {
                    return <FormatePrice price={info.getValue()} />;
                }
            }),
            columnHelper.accessor("total_due", {
                header: "Status",
                cell: (info) => {
                    return (
                        <Chip
                            variant={"light"}
                            border={"none"}
                            size={"xs"}
                            color={info.getValue() > 0 ? "red" : "green"}
                            className={''}
                        >
                            {info.getValue() > 0 ? <FormatePrice price={info.getValue()} /> : "Paid"}
                        </Chip>
                    );
                },
            }),
            columnHelper.accessor("delivered_at", {
                header: "Is Delivered",
                cell: (info) => {
                    const deliveredAt = info.getValue() ? formatDate(new Date(info.getValue()), "dd/MM/yyyy HH:mm") : "Not Delivered";
                    // Marking delivered rewrites advance/total_due, both printed
                    // on the order PDF, so it is locked like any other edit.
                    const isLocked = isBillLockedForEditing(info.row.original);
                    return (
                        <Chip
                            variant={"light"}
                            border={"none"}
                            size={"xs"}
                            color={info.getValue() ? "green" : "gray"}
                            className={isLocked ? 'opacity-40 cursor-not-allowed' : ''}
                            title={isLocked ? EDIT_LOCK_REASON : undefined}
                            onClick={() => {
                                if (isLocked) return;
                                setShowDeliveryAlert({ status: true, data: { order_id: info.row.original.order_id, collection_id: activeCollection, is_delivered: info.getValue() ? false : true } });
                            }}
                        >
                            {deliveredAt}
                        </Chip>
                    );
                },
            }),
            columnHelper.display({
                id: "whatsapp_delivery_status",
                header: "WhatsApp",
                // Force cancel sits beside the status so it is discoverable exactly
                // when a delivery is processing, and invisible otherwise (PRD 20).
                cell: (info) => (
                    <div className="flex items-center gap-1">
                        <WhatsAppDeliveryStatus bill={info.row.original} />
                        <WhatsAppCancelAction
                            bill={info.row.original}
                            collectionId={activeCollection}
                        />
                    </div>
                ),
            }),
        ]
        // activeCollection is read inside the cell, so the columns must be rebuilt
        // when the operator switches collections.
    ), [activeCollection]);

    const headers = {};
    columnsDef.forEach((column) => {
        const key = column.id ?? column.accessorKey;
        headers[key] = column.header;
    });

    const data = useMemo(() => ordersData?.orders ?? [], [ordersData]);
    const columns = useMemo(() => columnsDef, []);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        rowCount: ordersData?.pagination?.totalItems ?? -1,
        state: {
            pagination,
            columnOrder,
            columnVisibility,
        },
        onPaginationChange: setPagination,
        onColumnOrderChange: setColumnOrder,
        onColumnVisibilityChange: setColumnVisibility,
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
    });

    const updateOrderDeliveryStatusMutation = useMutation({
        mutationFn: updateOrderDeliveryStatus,
        onSuccess: () => {
            toast.success(`Delivery status updated successfully`)
            setShowDeliveryAlert({ status: false, data: null })
            queryClient.invalidateQueries(["bills", activeCollection]);
        },
        onError: (error) => {
            // Surface the server's reason (a delivery lock, say) instead of a
            // bare "status code 409".
            const response = error?.response?.data;
            setShowDeliveryAlert({ status: false, data: null });
            toast.error(response?.message || `Error updating delivery status ${error.message}`);
            queryClient.invalidateQueries(["bills", activeCollection]);
        }
    });

    const handleMarkAsDelivered = (data) => {
        updateOrderDeliveryStatusMutation.mutate({ ...data, data: { is_delivered: data.is_delivered } })
    }

    useEffect(() => {
        if (ordersDataError) {
            toast.error(`Error getting orders`)
        }
        if (wholesaleBillsError) {
            toast.error(`Error getting wholesale orders`)
        }
    }, [ordersDataError, wholesaleBillsError]);

    return (
        <>
            <AlertDialog open={showDeliveryAlert.status} onOpenChange={(value) => !value && setShowDeliveryAlert({ status: false, data: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{showDeliveryAlert.data?.is_delivered ? "Mark this order as delivered?" : "Mark this order as not delivered?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {showDeliveryAlert.data?.is_delivered ? "This will mark this order as delivered." : "This will mark this order as not delivered."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleMarkAsDelivered(showDeliveryAlert.data)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {order_id && <BillsPdfModal open={!!order_id} onClose={() => navigate(`/orders/${orderType}`)} />}
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client name or number"
                        className="w-56"
                        autoFocus
                    />
                    {search && <Button variant="none" onClick={() => setSearch('')}>
                        Clear
                    </Button>}
                </div>

                <div className="flex items-center space-x-5">
                    {orderType === 'wholesale' && <CSVLink
                        ref={csvLinkRef}
                        data={wholesaleBills ?? []}
                        filename={"wholesale-orders.csv"}
                        headers={csvHeaders}
                        onClick={async (event, done) => {
                            if (csvDownloadReady.current) {
                                csvDownloadReady.current = false;
                                done();
                                return;
                            }
                            event.preventDefault();
                            const result = await refetch();
                            const rows = result.data ?? [];
                            if (!rows.length) {
                                toast.error("No wholesale orders to export");
                                return;
                            }
                            csvDownloadReady.current = true;
                            setCsvDownloadTick((tick) => tick + 1);
                        }}
                    >
                        <Button variant="none" className="flex items-center cursor-pointer border border-green-500/30 gap-x-3.5 py-1 px-2 rounded-lg text-sm text-green-600 dark:text-green-400 hover:bg-green-500/10 focus:outline-none focus:bg-green-500/10 font-normal" disabled={isWholesaleBillsLoading} >
                            {isWholesaleBillsLoading ? <Spinner /> : <Avatar className="w-6 h-6 rounded-none">
                                <AvatarImage src={`/csv.svg`} />
                            </Avatar>}
                            CSV File
                        </Button>
                    </CSVLink>}
                    <Link to={`/orders/${orderType}/report`} className="flex items-center space-x-2 border border-destructive/30 rounded-lg px-2 cursor-pointer hover:bg-destructive/10 py-1 text-destructive">
                        <Avatar className="w-6 h-6 rounded-none">
                            <AvatarImage src={`/pdf.svg`} />
                        </Avatar>
                        <span className=" text-sm"> Report</span>
                    </Link>
                    <DataTableViewOptions table={table} headers={headers} />
                    <Select value={pagination.pageSize} onValueChange={(value) => setPagination((prev) => ({ ...prev, pageSize: value }))}>
                        <SelectTrigger className="w-16 py-1.5">
                            <SelectValue placeholder="Page Size" />
                        </SelectTrigger>
                        <SelectContent align="end" className="min-w-[3rem]" >
                            <SelectItem value={5}>5</SelectItem>
                            <SelectItem value={10}>10</SelectItem>
                            <SelectItem value={20}>20</SelectItem>
                            <SelectItem value={50}>50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isOrdersDataLoading ? <div className="flex justify-center items-center h-64">
                <div className="basic-loader"></div>
            </div> :
                <>
                    <ScrollArea className="w-full overflow-y-auto">
                        <div className="mt-3">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow className="border-t" key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead
                                                        key={header.id}
                                                        className="whitespace-nowrap"
                                                    >
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                    </TableHead>
                                                );
                                            })}
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows?.length ? (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                                className=""
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="flex items-center space-x-2">
                                                    <Link
                                                        to={`/orders/${orderType}?order_id=${row.original?.order_id}`}
                                                        className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                                                    // target="_blank"
                                                    >
                                                        <Eye size={16} className="text-blue-500" />
                                                    </Link>
                                                    {/* A processing delivery locks the order (ADR 0005); force
                                                        cancel sits in the WhatsApp column of the same row. */}
                                                    {isBillLockedForEditing(row.original) ? (
                                                        <span
                                                            title={EDIT_LOCK_REASON}
                                                            aria-label={EDIT_LOCK_REASON}
                                                            className="rounded-full size-8 flex items-center justify-center opacity-40 cursor-not-allowed"
                                                        >
                                                            <Lock size={16} className="text-muted-foreground" />
                                                        </span>
                                                    ) : (
                                                        <Link
                                                            to={`/orders/update/${row.original?.order_id}?order_type=${orderType}`}
                                                            className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                                                        >
                                                            <Pencil size={16} className="text-green-500" />
                                                        </Link>
                                                    )}
                                                    <WhatsAppResendAction
                                                        bill={row.original}
                                                        collectionId={activeCollection}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length}
                                                className="h-24 text-center"
                                            >
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    <div className="flex items-center justify-between p-4">
                        <div className="">{table.getRowCount()} Orders</div>
                        <div className="flex items-center space-x-2 ">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <MdKeyboardDoubleArrowLeft />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <IoIosArrowBack />
                            </Button>
                            <Button variant="outline">{pagination.pageIndex + 1}</Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <IoIosArrowForward />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <MdKeyboardDoubleArrowRight />
                            </Button>
                        </div>
                    </div>
                </>}
        </>
    );
};

export default BillsTable;
