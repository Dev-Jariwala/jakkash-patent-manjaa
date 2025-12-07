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
import { Chip } from "@/components/ui/chip";
import { useDebounce, useLocalStorage } from "@uidotdev/usehooks";
import { getProductsByCollectionId } from "@/services/products";
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import FormatePrice from "@/helper/FormatPrice";

const columnHelper = createColumnHelper();
const columnsDef = [
  columnHelper.accessor("sr_no", {
    header: "Sr No",
    cell: (info) => {
      return `P-${info.getValue()}`;
    }
  }),
  columnHelper.accessor("product_name", {
    header: "Product Name",
  }),
  columnHelper.accessor("retail_price", {
    header: "Retail Price",
    cell: (info) => {
      return <FormatePrice price={info.getValue()} />;
    }
  }),
  columnHelper.accessor("wholesale_price", {
    header: "Wholesale Price",
    cell: (info) => {
      return <FormatePrice price={info.getValue()} />;
    }
  }),
  columnHelper.accessor("stock_in_hand", {
    header: "Stock In Hand",
  }),
  columnHelper.accessor("total_stock", {
    header: "Total Stock",
  }),
  columnHelper.accessor("is_labour", {
    header: "Category",
    cell: (info) => {
      return (
        <Chip
          variant={"light"}
          border={"none"}
          size={"xs"}
          color={!info.getValue() ? "indigo" : "gray"}
          className={''}
        >
          {info.getValue() ? "Labour" : "Product"}
        </Chip>
      );
    },
  }),
];

const headers = {};
columnsDef.forEach((column) => {
  headers[column.accessorKey] = column.header;
});

const ProductsTable = () => {
  const [activeCollection] = useLocalStorage("activeCollection", null);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5, });
  const [columnVisibility, setColumnVisibility] = useState({});
  const [columnOrder, setColumnOrder] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: productData, isLoading: isProductDataLoading, error: productDataError } = useQuery({
    queryKey: ["products", activeCollection, pagination, debouncedSearch],
    queryFn: async () => {
      const response = await getProductsByCollectionId({ activeCollection, pagination, debouncedSearch });
      return response.data;
    },
    enabled: !!activeCollection,
  });

  const data = useMemo(() => productData?.products ?? [], [productData]);
  const columns = useMemo(() => columnsDef, []);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    rowCount: productData?.totalProducts ?? -1,
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
    if (productDataError) {
      toast.error(productDataError.message || "Error while fetching products");
    }
  }, [productDataError]);

  return (
    <>
      <div className="flex items-center justify-between px-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product name..."
          className="max-w-64"
        />
        <div className="flex items-center space-x-5">
          <Link to={`/products/report`} className="flex items-center space-x-2 border border-red-200 rounded-lg px-2 cursor-pointer hover:bg-red-100 py-1 text-red-700">
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
      {isProductDataLoading ? <div className="flex justify-center items-center h-64">
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
                            to={`/products/update?product_id=${row.original?.product_id}`}
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
            <div className="">{table.getRowCount()} Products</div>
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
        </>
      }
    </>
  );
};

export default ProductsTable;
