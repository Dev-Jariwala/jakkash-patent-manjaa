import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable, } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight, } from "react-icons/md";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { toast } from "react-toastify";
import { getCollectionsOptions } from "@/services/collections";

const columnHelper = createColumnHelper();
const columnsDef = [
    columnHelper.accessor("sr_no", {
        header: "Sr No",
        cell: (info) => {
            return `P-${info.getValue()}`;
        }
    }),
    columnHelper.accessor("collection_name", {
        header: "Collection Name",
    }),
];

const ProductsTable = () => {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });

    const { data: collections, isLoading: isCollectionsLoading, error: collectionsError } = useQuery({
        queryKey: ["collections",],
        queryFn: async () => {
            const response = await getCollectionsOptions();
            return response.data?.collections || [];
        }
    });

    const columns = useMemo(() => columnsDef, []);
    const table = useReactTable({
        data: collections || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        rowCount: collections?.length ?? -1,
        state: {
            pagination,
        },
        onPaginationChange: setPagination,
        getPaginationRowModel: getPaginationRowModel(),
    });

    useEffect(() => {
        if (collectionsError) {
            toast.error(collectionsError.message || "Error while fetching products");
        }
    }, [collectionsError]);

    return (
        <>
            {isCollectionsLoading ? <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
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
                                                        to={`/collections/update?collection_id=${row.original?.collection_id}`}
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
                        <div className="">{table.getRowCount()} Products</div>
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
            }
        </>
    );
};

export default ProductsTable;
