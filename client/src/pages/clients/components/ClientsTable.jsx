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
import { Eye, Pencil } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";

const columnHelper = createColumnHelper();
const emptyCell = (value) => (value == null || value === "" ? "-" : value);

const columnsDef = [
    columnHelper.accessor("name", {
        header: "Client Name",
        cell: (info) => emptyCell(info.getValue()),
    }),
    columnHelper.accessor("mobile", {
        header: "Mobile",
        cell: (info) => emptyCell(info.getValue()),
    }),
    columnHelper.accessor("address", {
        header: "Address",
        cell: (info) => emptyCell(info.getValue()),
    }),
    columnHelper.accessor("state_name", {
        header: "State",
        cell: (info) => emptyCell(info.getValue()),
    }),
    columnHelper.accessor("city_name", {
        header: "City",
        cell: (info) => emptyCell(info.getValue()),
    }),
    columnHelper.accessor("gst_number", {
        header: "GST Number",
        cell: (info) => emptyCell(info.getValue()),
    }),
    columnHelper.accessor("contact_person", {
        header: "Contact Person",
        cell: (info) => emptyCell(info.getValue()),
    }),
    columnHelper.accessor("contact_number", {
        header: "Contact Number",
        cell: (info) => emptyCell(info.getValue()),
    }),
];

const headers = {};
columnsDef.forEach((column) => {
  headers[column.accessorKey] = column.header;
});

const csvColumns = [
    { label: "Name", key: "name" },
    { label: "Mobile", key: "mobile" },
    { label: "Address", key: "address" },
    { label: "Pincode", key: "pincode" },
    { label: "State", key: "state_name" },
    { label: "City", key: "city_name" },
    { label: "GST Number", key: "gst_number" },
    { label: "Contact Person", key: "contact_person" },
    { label: "Contact Number", key: "contact_number" },
];

const csvCell = (value) => {
    const text = value == null ? "" : String(value);
    return `"${text.replaceAll('"', '""')}"`;
};

const downloadClientsCsv = (rows) => {
    const csv = [
        csvColumns.map((column) => csvCell(column.label)).join(","),
        ...rows.map((row) => csvColumns.map((column) => csvCell(row[column.key])).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "clients.csv";
    link.click();
    URL.revokeObjectURL(url);
};

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
    const { error: clientsError, isLoading: isClientsLoading, refetch } = useQuery({
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
                        placeholder="Search clients..."
                        className="w-56"
                    />
                </div>

                <div className="flex items-center space-x-5">
                    <Button
                        variant="none"
                        className="flex items-center cursor-pointer border border-green-500/30 gap-x-3.5 py-1 px-2 rounded-lg text-sm text-green-600 dark:text-green-400 hover:bg-green-500/10 focus:outline-none focus:bg-green-500/10 font-normal"
                        disabled={isClientsLoading}
                        onClick={async () => {
                            const result = await refetch();
                            downloadClientsCsv(result.data ?? []);
                        }}
                    >
                        {isClientsLoading ? <Spinner /> : <Avatar className="w-6 h-6 rounded-none">
                            <AvatarImage src={`/csv.svg`} />
                        </Avatar>}
                        CSV File
                    </Button>
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
                                                        to={`/clients/edit/${row.original?.mobile}`}
                                                        className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                                                        title="Edit client"
                                                    >
                                                        <Pencil size={16} className="text-amber-600" />
                                                    </Link>
                                                    <Link
                                                        to={`/clients/report?mobile=${row.original?.mobile}`}
                                                        className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                                                        title="View report"
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
