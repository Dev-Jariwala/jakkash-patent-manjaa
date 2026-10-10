import BreadCrum from "@/components/breadcrum/BreadCrum";
import QueryError from "@/components/Errors/QueryError";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMastersCities,
  getMastersCountries,
  getMastersStates,
} from "@/services/common";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";

const activeLabel = (isActive) => (isActive ? "Yes" : "No");

const DEFAULT_PAGE_SIZE = 10;

const PaginatedLocationTab = ({
  queryKey,
  fetchPage,
  listKey,
  entityLabel,
  emptyMessage,
  columns,
  mapRows,
}) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...queryKey, pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const response = await fetchPage({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      });
      return response.data;
    },
  });

  const rows = mapRows(data?.[listKey] ?? []);
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const canPreviousPage = pagination.pageIndex > 0;
  const canNextPage = pagination.pageIndex + 1 < totalPages;

  const goToPage = (pageIndex) => {
    setPagination((prev) => ({ ...prev, pageIndex }));
  };

  if (isError) {
    return <QueryError error={error} />;
  }

  return (
    <>
      <div className="flex items-center justify-end mb-3">
        <Select
          value={String(pagination.pageSize)}
          onValueChange={(value) =>
            setPagination({ pageIndex: 0, pageSize: Number(value) })
          }
        >
          <SelectTrigger className="w-16 py-1.5">
            <SelectValue placeholder="Page Size" />
          </SelectTrigger>
          <SelectContent align="end" className="min-w-[3rem]">
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="basic-loader" />
        </div>
      ) : (
        <>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-t">
                  {columns.map((column) => (
                    <TableHead key={column.key}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.key}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex items-center justify-between py-4">
            <div>{totalCount} {entityLabel}</div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(0)}
                disabled={!canPreviousPage}
              >
                <MdKeyboardDoubleArrowLeft />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.pageIndex - 1)}
                disabled={!canPreviousPage}
              >
                <IoIosArrowBack />
              </Button>
              <Button variant="outline">{pagination.pageIndex + 1}</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.pageIndex + 1)}
                disabled={!canNextPage}
              >
                <IoIosArrowForward />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages - 1)}
                disabled={!canNextPage}
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

const countryColumns = [
  { key: "sr_no", header: "Sr No", cell: (row) => row.sr_no },
  { key: "name", header: "Name", cell: (row) => row.name },
  { key: "iso2", header: "ISO2", cell: (row) => row.iso2 },
  { key: "iso3", header: "ISO3", cell: (row) => row.iso3 },
  {
    key: "active",
    header: "Active",
    cell: (row) => activeLabel(row.is_active),
  },
];

const stateColumns = [
  { key: "sr_no", header: "Sr No", cell: (row) => row.sr_no },
  { key: "name", header: "State", cell: (row) => row.name },
  { key: "country", header: "Country", cell: (row) => row.country_name },
  {
    key: "active",
    header: "Active",
    cell: (row) => activeLabel(row.is_active),
  },
];

const cityColumns = [
  { key: "sr_no", header: "Sr No", cell: (row) => row.sr_no },
  { key: "name", header: "City", cell: (row) => row.name },
  { key: "state", header: "State", cell: (row) => row.state_name },
  {
    key: "active",
    header: "Active",
    cell: (row) => activeLabel(row.is_active),
  },
];

const Masters = () => {
  return (
    <div>
      <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
        <div className="text-xl text-foreground font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/masters", label: "Masters" },
            ]}
          />
        </div>
      </div>

      <Tabs defaultValue="countries" className="px-5">
        <TabsList className="w-full max-w-2xl gap-2 border-b pb-0 border-border">
          <TabsTrigger
            className="border-b-2 flex-1 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500"
            variant="sliding"
            value="countries"
          >
            Countries
          </TabsTrigger>
          <TabsTrigger
            className="border-b-2 flex-1 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500"
            variant="sliding"
            value="states"
          >
            States
          </TabsTrigger>
          <TabsTrigger
            className="border-b-2 flex-1 border-transparent data-[state=active]:rounded-none data-[state=active]:border-b-indigo-500"
            variant="sliding"
            value="cities"
          >
            Cities
          </TabsTrigger>
        </TabsList>
        <TabsContent value="countries" className="mt-4">
          <PaginatedLocationTab
            queryKey={["masters", "countries"]}
            fetchPage={getMastersCountries}
            listKey="countries"
            entityLabel="Countries"
            emptyMessage="No countries found."
            columns={countryColumns}
            mapRows={(items) =>
              items.map((country) => ({
                key: country.country_id,
                sr_no: country.sr_no,
                name: country.name,
                iso2: country.iso2,
                iso3: country.iso3,
                is_active: country.is_active,
              }))
            }
          />
        </TabsContent>
        <TabsContent value="states" className="mt-4">
          <PaginatedLocationTab
            queryKey={["masters", "states"]}
            fetchPage={getMastersStates}
            listKey="states"
            entityLabel="States"
            emptyMessage="No states found."
            columns={stateColumns}
            mapRows={(items) =>
              items.map((state) => ({
                key: state.state_id,
                sr_no: state.sr_no,
                name: state.name,
                country_name: state.country_name,
                is_active: state.is_active,
              }))
            }
          />
        </TabsContent>
        <TabsContent value="cities" className="mt-4">
          <PaginatedLocationTab
            queryKey={["masters", "cities"]}
            fetchPage={getMastersCities}
            listKey="cities"
            entityLabel="Cities"
            emptyMessage="No cities found."
            columns={cityColumns}
            mapRows={(items) =>
              items.map((city) => ({
                key: city.city_id,
                sr_no: city.sr_no,
                name: city.name,
                state_name: city.state_name,
                is_active: city.is_active,
              }))
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Masters;
