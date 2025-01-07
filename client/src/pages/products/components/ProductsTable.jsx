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
import { FaFileAlt } from "react-icons/fa";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

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
  }),
  columnHelper.accessor("wholesale_price", {
    header: "Wholesale Price",
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

const ProductsTable = () => {
  const [activeCollection] = useLocalStorage("activeCollection", null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });
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
    },
    onPaginationChange: setPagination,
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
      <div className="tw-flex tw-items-center tw-justify-between tw-px-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search product name..."
          className="tw-max-w-64"
        />
        <div className="tw-flex tw-items-center tw-space-x-5">
          <Link to={`/products/report`} className="tw-flex tw-items-center tw-space-x-2 tw-border tw-border-red-200 tw-rounded-lg tw-px-2 tw-cursor-pointer hover:tw-bg-red-100 tw-py-1 tw-text-red-700">
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
      {isProductDataLoading ? <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
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
                            to={`/products/update?product_id=${row.original?.product_id}`}
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
