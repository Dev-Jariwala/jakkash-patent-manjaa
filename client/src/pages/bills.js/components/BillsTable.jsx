import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight, } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { getBillsByCollectionId } from "@/services/bills";
import { toast } from "react-toastify";
import { FaFileAlt } from "react-icons/fa";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BillsPdfModal from "./BillsPdfModal";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const columnHelper = createColumnHelper();
const columnsDef = [
    columnHelper.accessor("bill_no", {
        header: "Bill No",
    }),
    columnHelper.accessor("order_date", {
        header: "Order Date",
        cell: (info) => {
            return info.getValue() ? format(new Date(info.getValue()), "dd/MM/yyyy") : "-";
        }
    }),
    columnHelper.accessor("name", {
        header: "Client Name",
    }),
    columnHelper.accessor("sub_total", {
        header: "Total",
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
                    {info.getValue() > 0 ? info.getValue() : "Paid"}
                </Chip>
            );
        },
    }),
];

// eslint-disable-next-line react/prop-types
const BillsTable = () => {
    const { billType } = useParams();
    const navigate = useNavigate();
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);
    const [searchParams] = useSearchParams();
    const bill_id = searchParams.get("bill_id");

    const { data: billsData, error: billsDataError, isLoading: isBillsDataLoading } = useQuery({
        queryKey: ["bills", activeCollection, pagination, debouncedSearch, billType],
        queryFn: async () => {
            const response = await getBillsByCollectionId({ activeCollection, pagination, debouncedSearch, bill_type: billType });
            return response.data;
        },
        enabled: !!activeCollection,
    });

    const data = useMemo(() => billsData?.bills ?? [], [billsData]);
    const columns = useMemo(() => columnsDef, []);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        rowCount: billsData?.pagination?.totalItems ?? -1,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
    });

    useEffect(() => {
        if (billsDataError) {
            toast.error(`Error getting bills`)
        }
    }, [billsDataError])

    return (
        <>
            {bill_id && <BillsPdfModal open={!!bill_id} onClose={() => navigate(`/bills/${billType}`)} />}
            <div className="tw-flex tw-items-center tw-justify-between tw-px-4">
                <div className="tw-flex tw-items-center tw-space-x-4">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client name or number"
                        className="tw-w-56"
                    />
                </div>

                <div className="tw-flex tw-items-center tw-space-x-5">
                    <Link to={`/bills/${billType}/report`} className="tw-flex tw-items-center tw-space-x-2 tw-border tw-border-red-200 tw-rounded-lg tw-px-2 tw-cursor-pointer hover:tw-bg-red-100 tw-py-1 tw-text-red-700">
                        <Avatar className="tw-w-6 tw-h-6 tw-rounded-none">
                            <AvatarImage src={`/pdf.svg`} />
                        </Avatar>
                        <span className=" tw-text-sm"> Report</span>
                    </Link>
                    <Select value={pagination.pageSize} onValueChange={(value) => setPagination((prev) => ({ ...prev, pageSize: value }))}>
                        <SelectTrigger className="tw-w-24">
                            <SelectValue placeholder="Page Size" />
                        </SelectTrigger>
                        <SelectContent align="end" >
                            <SelectItem value={5}>5</SelectItem>
                            <SelectItem value={10}>10</SelectItem>
                            <SelectItem value={20}>20</SelectItem>
                            <SelectItem value={50}>50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isBillsDataLoading ? <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
                <div className="basic-loader"></div>
            </div> :
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
                                                        to={`/bills/${billType}?bill_id=${row.original?.bill_id}`}
                                                        className="hover:tw-bg-gray-200 tw-rounded-full tw-size-8 tw-flex tw-items-center tw-justify-center"
                                                    // target="_blank"
                                                    >
                                                        <Eye size={16} className="tw-text-blue-500" />
                                                    </Link>
                                                    <Link
                                                        to={`/bills/update/${row.original?.bill_id}?bill_type=${billType}`}
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
                        <div className="">{table.getRowCount()} Bills</div>
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

export default BillsTable;
