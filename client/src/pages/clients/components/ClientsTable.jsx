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
import { useDebounce } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { getAllClients, getClients } from "@/services/clients";
import { Link } from "react-router-dom";
import { Download, Eye } from "lucide-react";
import { CSVLink } from "react-csv";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";


const columnHelper = createColumnHelper();
const columnsDef = [
    columnHelper.accessor("name", {
        header: "Client Name",
    }),
    columnHelper.accessor("mobile", {
        header: "Mobile",
    }),
    columnHelper.accessor("address", {
        header: "Address",
    }),
];

// eslint-disable-next-line react/prop-types
const ClientsTable = () => {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const { data: clientsData, error: clientsDataError, isLoading: isClientsDataLoading } = useQuery({
        queryKey: ["clients", pagination, debouncedSearch],
        queryFn: async () => {
            const response = await getClients({ pagination, debouncedSearch });
            return response.data;
        }
    });
    const { data: clients, error: clientsError, isLoading: isClientsLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getAllClients();
            return response.data?.clients ?? [];
        },
    });

    const data = useMemo(() => clientsData?.clients ?? [], [clientsData]);
    const columns = useMemo(() => columnsDef, []);
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        rowCount: clientsData?.totalClients ?? -1,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
    });

    useEffect(() => {
        if (clientsDataError) {
            toast.error(`Error getting bills`)
        }
        if (clientsError) {
            toast.error(`Error getting clients`)
        }
    }, [clientsDataError, clientsError])

    return (
        <>
            <div className="tw-flex tw-items-center tw-justify-between tw-px-4">
                <div className="tw-flex tw-items-center tw-space-x-4">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client name..."
                        className="tw-w-56"
                    />
                </div>

                <div className="tw-flex tw-items-center tw-space-x-5">
                    <CSVLink
                        data={clients ?? []}
                        filename={"clients.csv"}
                        headers={[
                            { label: "Name", key: "name" },
                            { label: "Mobile", key: "mobile" }
                        ]}
                    >
                        <div className="tw-flex tw-items-center tw-cursor-pointer tw-border tw-gap-x-3.5 tw-py-2 tw-px-3 tw-rounded-lg tw-text-sm tw-text-green-600 hover:tw-bg-green-100 focus:tw-outline-none focus:tw-bg-green-100 dark:tw-text-green-400 dark:hover:tw-bg-green-700 dark:hover:tw-text-green-300 dark:focus:tw-bg-green-700">
                            {isClientsLoading ? <Spinner /> : <Avatar className="tw-w-6 tw-h-6 tw-rounded-none">
                                <AvatarImage src={`/csv.svg`} />
                            </Avatar>}
                            CSV File
                        </div>
                    </CSVLink>
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
            </div >
            {
                isClientsDataLoading ? (
                    <div className="tw-flex tw-items-center tw-justify-center tw-h-64" >
                        <div className="basic-loader"></div>
                    </div >
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
                                                        to={`/clients/report?mobile=${row.original?.mobile}`}
                                                        className="hover:tw-bg-gray-200 tw-rounded-full tw-size-8 tw-flex tw-items-center tw-justify-center"
                                                    >
                                                        <Eye size={16} className="tw-text-blue-500" />
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
                        <div className="">{table.getRowCount()} Clients</div>
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

export default ClientsTable;
