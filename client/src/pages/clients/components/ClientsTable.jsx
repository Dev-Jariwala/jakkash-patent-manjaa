import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight, } from "react-icons/md";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { getAllClients, getClients } from "@/services/clients";
import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { CSVLink } from "react-csv";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";

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

const headers = {};
columnsDef.forEach((column) => {
  headers[column.accessorKey] = column.header;
});

// eslint-disable-next-line react/prop-types
const ClientsTable = () => {
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5, });
    const [columnVisibility, setColumnVisibility] = useState({});
    const [columnOrder, setColumnOrder] = useState([]);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 300);

    const { data: clientsData, error: clientsDataError, isLoading: isClientsDataLoading } = useQuery({
        queryKey: ["clients", pagination, debouncedSearch],
        queryFn: async () => {
            const response = await getClients({ pagination, debouncedSearch });
            return response.data;
        }
    });
    const { data: clients, error: clientsError, isLoading: isClientsLoading, refetch } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const response = await getAllClients();
            return response.data?.clients ?? [];
        },
        enabled: false
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
            columnVisibility,
            columnOrder,
        },
        onPaginationChange: setPagination,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnOrderChange: setColumnOrder,
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
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-4">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search client name..."
                        className="w-56"
                    />
                </div>

                <div className="flex items-center space-x-5">
                    <CSVLink
                        data={clients ?? []}
                        filename={"clients.csv"}
                        headers={[
                            { label: "Name", key: "name" },
                            { label: "Mobile", key: "mobile" }
                        ]}
                        asyncOnClick={true}
                        onClick={(e, done) => {
                            refetch().then(() => {
                                done();
                            });
                        }}
                    >
                        <Button variant="none" className="flex items-center cursor-pointer border border-green-200 gap-x-3.5 py-1 px-2 rounded-lg text-sm text-green-600 hover:bg-green-100 focus:outline-none focus:bg-green-100 font-normal" disabled={isClientsLoading} >
                            {isClientsLoading ? <Spinner /> : <Avatar className="w-6 h-6 rounded-none">
                                <AvatarImage src={`/csv.svg`} />
                            </Avatar>}
                            CSV File
                        </Button>
                    </CSVLink>
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
            </div >
            {
                isClientsDataLoading ? (
                    <div className="flex items-center justify-center h-64" >
                        <div className="basic-loader"></div>
                    </div >
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
                                                        to={`/clients/report?mobile=${row.original?.mobile}`}
                                                        className="hover:bg-gray-200 rounded-full size-8 flex items-center justify-center"
                                                    >
                                                        <Eye size={16} className="text-blue-500" />
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
                        <div className="">{table.getRowCount()} Clients</div>
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

export default ClientsTable;
