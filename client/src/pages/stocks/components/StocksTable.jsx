import { useQuery } from "@tanstack/react-query";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import {
    MdKeyboardDoubleArrowLeft,
    MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { getStocksByCollectionId } from "@/services/stocks";
import { FaFileAlt } from "react-icons/fa";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";


const columnHelper = createColumnHelper();
const columnsDef = [
    columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => {
            return info.getValue() ? format(new Date(info.getValue()), "dd/MM/yyyy") : "-";
        }
    }),
    columnHelper.accessor("product_name", {
        header: "Product Name",
    }),
    columnHelper.accessor("quantity", {
        header: "Quantity",
    }),
];

// eslint-disable-next-line react/prop-types
const StocksTable = () => {
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const { data: stocksData, isLoading: isStockDataLoading, error: stocksDataError } = useQuery({
        queryKey: ["stocks", activeCollection, pagination, debouncedSearch],
        queryFn: async () => {
            const response = await getStocksByCollectionId({ activeCollection, pagination, debouncedSearch });
            return response.data;
        },
        enabled: !!activeCollection,
    });

    const data = useMemo(() => stocksData?.stocks ?? [], [stocksData]);
    const columns = useMemo(() => columnsDef, []);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        rowCount: stocksData?.totalStocks ?? -1,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
    });

    useEffect(() => {
        if (stocksDataError) {
            toast.error(`Error getting bills`)
        }
    }, [stocksDataError])

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
                    <Link to={`/stocks/report`} className="tw-flex tw-items-center tw-space-x-2 tw-border tw-border-red-200 tw-rounded-lg tw-px-2 tw-cursor-pointer hover:tw-bg-red-100 tw-py-1 tw-text-red-700">
                        <Avatar className="tw-w-6 tw-h-6 tw-rounded-none">
                            <AvatarImage src={`/pdf.svg`} />
                        </Avatar>
                        <span className=" tw-text-sm"> Report</span>
                    </Link>
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
            {isStockDataLoading ? (
                <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : <>
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
                                                    to={`/stocks/update?stock_id=${row.original?.stock_id}`}
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
                    <div className="">{table.getRowCount()} Stocks</div>
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
            </>}
        </>
    );
};

export default StocksTable;
