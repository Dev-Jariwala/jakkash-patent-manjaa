/* eslint-disable react/prop-types */
import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
import { RequiredMark } from "@/components/form/RequiredMark";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/tremor-dialog";
import {
  createMastersBillSeries,
  getMastersBillSeries,
  updateMastersBillSeries,
} from "@/services/common";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { toast } from "react-toastify";
import * as yup from "yup";

const DEFAULT_PAGE_SIZE = 10;

const emptyValues = {
  name: "",
};

const schema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required("Enter a bill series")
    .max(20, "A bill series cannot be longer than 20 characters")
    .test(
      "hyphen",
      "A bill series cannot contain a hyphen",
      (value) => !String(value ?? "").includes("-")
    ),
});

const statusSchema = yup.object().shape({
  is_active: yup
    .string()
    .oneOf(["active", "inactive"], "Select Active or Inactive")
    .required("Select Active or Inactive"),
});

const EditBillSeriesDialog = ({ open, onClose, row }) => {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: yupResolver(statusSchema),
    defaultValues: { is_active: "active" },
  });

  useEffect(() => {
    if (!open || !row) {
      form.reset({ is_active: "active" });
      return;
    }
    form.reset({ is_active: row.is_active ? "active" : "inactive" });
  }, [open, row, form]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await updateMastersBillSeries(row.bill_series_id, {
        is_active: data.is_active === "active",
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masters", "bill-series"] });
      onClose();
      toast.success("Bill series updated");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Error updating bill series";
      error.message = message;
      toast.error(message);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-lg p-0"
        style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}
      >
        <DialogHeader className="flex-row justify-between px-4 py-2 border-b">
          <DialogTitle className="text-base">Edit bill series</DialogTitle>
          <DialogClose>
            <X size={20} />
          </DialogClose>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
            className="px-4 py-4 space-y-4"
          >
            <MutationError mutation={saveMutation} />
            <div className="space-y-2">
              <Label>Bill series</Label>
              <Input value={row?.name ?? ""} disabled readOnly />
            </div>
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status <RequiredMark />
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Active" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const AddBillSeriesDialog = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues);
    }
  }, [open, form]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await createMastersBillSeries({ name: data.name.trim() });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masters", "bill-series"] });
      onClose();
      toast.success("Bill series added");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Error adding bill series";
      error.message = message;
      toast.error(message);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-lg p-0"
        style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}
      >
        <DialogHeader className="flex-row justify-between px-4 py-2 border-b">
          <DialogTitle className="text-base">Add bill series</DialogTitle>
          <DialogClose>
            <X size={20} />
          </DialogClose>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))}
            className="px-4 py-4 space-y-4"
          >
            <MutationError mutation={saveMutation} />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Bill series <RequiredMark />
                  </FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                Add
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const BillSeriesTab = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["masters", "bill-series", pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const response = await getMastersBillSeries({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      });
      return response.data;
    },
  });

  const rows = (data?.bill_series ?? []).map((row, index) => ({
    key: row.bill_series_id,
    sr_no: pagination.pageIndex * pagination.pageSize + index + 1,
    ...row,
  }));

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
      <div className="flex items-center justify-end gap-2 mb-3">
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
        <Button variant="indigo" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add bill series
        </Button>
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
                  <TableHead>Sr No</TableHead>
                  <TableHead>Bill series</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No bill series yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>{row.sr_no}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Chip
                          variant="light"
                          border="none"
                          size="xs"
                          color={row.is_active ? "green" : "red"}
                        >
                          {row.is_active ? "Active" : "Inactive"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setEditingRow(row)}
                          className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                          aria-label={`Edit ${row.name}`}
                        >
                          <Pencil size={16} className="text-green-500" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <div className="flex items-center justify-between py-4">
            <div>{totalCount} bill series</div>
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

      <AddBillSeriesDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      <EditBillSeriesDialog
        open={Boolean(editingRow)}
        row={editingRow}
        onClose={() => setEditingRow(null)}
      />
    </>
  );
};

export default BillSeriesTab;
