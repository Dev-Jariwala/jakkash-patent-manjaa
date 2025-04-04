import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight, } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { getPurchases } from "@/services/purchases";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import FormatePrice from "@/helper/FormatPrice";

const columnHelper = createColumnHelper();
const columnsDef = [
    columnHelper.accessor("purchase_date", {
        header: "Date",
        cell: (info) => {
            return info.getValue() ? format(new Date(info.getValue()), "dd/MM/yyyy") : "-";
        }
    }),
    columnHelper.accessor("supplier_name", {
        header: "Supplier Name",
    }),
    columnHelper.accessor("invoice_no", {
        header: "Invoice No",
    }),
    columnHelper.accessor("item_description", {
        header: "Item Description",
    }),
    columnHelper.accessor("rate", {
        header: "Rate",
        cell: (info) => {
            return <FormatePrice price={info.getValue()} />;
        }
    }),
    columnHelper.accessor("quantity", {
        header: "Quantity",
    }),
    columnHelper.accessor("total", {
        header: "Total",
        cell: (info) => {
            // return rate * quantity
            return <FormatePrice price={(info.row.original.rate * info.row.original.quantity).toFixed(2)} />;
        }
    }),
];
const headers = {};
columnsDef.forEach((column) => {
    headers[column.accessorKey] = column.header;
});
// eslint-disable-next-line react/prop-types
const PurchasesTable = () => {
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5, });
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnOrder, setColumnOrder] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const { data: purchasesData, error: purchasesDataError, isLoading: isPurchaseDataLoading } = useQuery({
        queryKey: ["purchases", activeCollection, pagination, debouncedSearch],
        queryFn: async () => {
            console.log({ activeCollection, pagination, debouncedSearch });
            const response = await getPurchases({ activeCollection, pagination, debouncedSearch });
            return response.data;
        },
        enabled: !!activeCollection,
    });

    const data = useMemo(() => purchasesData?.purchases ?? [], [purchasesData]);
    const columns = useMemo(() => columnsDef, []);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        rowCount: purchasesData?.totalPurchases ?? -1,
        state: {
            pagination,
            columnVisibility,
            columnOrder,
        },
        onPaginationChange: setPagination,
        onColumnOrderChange: setColumnOrder,
        onColumnVisibilityChange: setColumnVisibility,
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
    });

    useEffect(() => {
        if (purchasesDataError) {
            toast.error(`Error getting bills`)
        }
    }, [purchasesDataError])

    return (
        <>
            <div className="tw-flex tw-items-center tw-justify-between tw-px-4">
                <div className="tw-flex tw-items-center tw-space-x-4">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search product name..."
                        className="tw-w-56"
                    />
                </div>
                <div className="tw-flex tw-items-center tw-space-x-5">
                    <Link to={`/purchases/report`} className="tw-flex tw-items-center tw-space-x-2 tw-border tw-border-red-200 tw-rounded-lg tw-px-2 tw-cursor-pointer hover:tw-bg-red-100 tw-py-1 tw-text-red-700">
                        <Avatar className="tw-w-6 tw-h-6 tw-rounded-none">
                            <AvatarImage src={`/pdf.svg`} />
                        </Avatar>
                        <span className=" tw-text-sm"> Report</span>
                    </Link>
                    <DataTableViewOptions table={table} headers={headers} />
                    <Select value={pagination.pageSize} onValueChange={(value) => setPagination((prev) => ({ ...prev, pageSize: value }))}>
                        <SelectTrigger className="tw-w-16 tw-py-1.5">
                            <SelectValue placeholder="Page Size" />
                        </SelectTrigger>
                        <SelectContent align="end" className="tw-min-w-[3rem]" >
                            <SelectItem value={5}>5</SelectItem>
                            <SelectItem value={10}>10</SelectItem>
                            <SelectItem value={20}>20</SelectItem>
                            <SelectItem value={50}>50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            </div>
            {isPurchaseDataLoading ? (
                <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : (
                <>
                    <ScrollArea className="tw-w-full tw-overflow-y-auto">
                        <div className="tw-mt-3">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow className="tw-border-t" key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                return (
                                                    <TableHead
                                                        key={header.id}
                                                        className="tw-text-slate-700 tw-whitespace-nowrap"
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
                                                className="hover:tw-bg-gray-100"
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column.columnDef.cell,
                                                            cell.getContext()
                                                        )}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="tw-flex tw-items-center tw-space-x-2">
                                                    <Link
                                                        to={`/purchases/update?purchase_id=${row.original?.purchase_id}`}
                                                        className="hover:tw-bg-gray-200 tw-rounded-full tw-size-8 tw-flex tw-items-center tw-justify-center"
                                                    >
                                                        <Pencil size={16} className="tw-text-green-500" />
                                                    </Link>
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
                    <div className="tw-flex tw-items-center tw-justify-between tw-p-4">
                        <div className="">{table.getRowCount()} Purchases</div>
                        <div className="tw-flex tw-items-center tw-space-x-2 ">
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
                </>
            )}
        </>
    );
};

export default PurchasesTable;
