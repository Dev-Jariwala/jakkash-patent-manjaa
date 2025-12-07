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
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search product name..."
                        className="w-56"
                    />
                </div>

                <div className="flex items-center space-x-5">
                    <Link to={`/stocks/report`} className="flex items-center space-x-2 border border-red-200 rounded-lg px-2 cursor-pointer hover:bg-red-100 py-1 text-red-700">
                        <Avatar className="w-6 h-6 rounded-none">
                            <AvatarImage src={`/pdf.svg`} />
                        </Avatar>
                        <span className=" text-sm"> Report</span>
                    </Link>
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
            {isStockDataLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : <>
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
                                                    className="text-slate-700 whitespace-nowrap"
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
                                            className="hover:bg-gray-100"
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
                                                    to={`/stocks/update?stock_id=${row.original?.stock_id}`}
                                                    className="hover:bg-gray-200 rounded-full size-8 flex items-center justify-center"
                                                >
                                                    <Pencil size={16} className="text-green-500" />
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
                <div className="flex items-center justify-between p-4">
                    <div className="">{table.getRowCount()} Stocks</div>
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

export default StocksTable;
