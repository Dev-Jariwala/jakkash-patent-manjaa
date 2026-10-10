import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/tremor-dialog";
import {
  createMastersTaxCode,
  getMastersTaxCodes,
  updateMastersTaxCode,
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

const formatRate = (value) => Number(value);

const emptyValues = {
  type: "HSN",
  code: "",
  description: "",
  cgst: "",
  sgst: "",
  igst: "",
};

const buildSchema = (isEdit) =>
  yup.object().shape({
    type: isEdit ? yup.string().required() : yup.string().oneOf(["HSN", "SAC"]).required(),
    code: yup.string().trim().required("Code is required"),
    description: yup.string().trim().required("Description is required"),
    cgst: yup.string().trim().required("CGST is required"),
    sgst: yup.string().trim().required("SGST is required"),
    igst: yup.string().trim().required("IGST is required"),
  });

const TaxCodeFormDialog = ({ open, onClose, editingRow }) => {
  const queryClient = useQueryClient();
  const isEdit = Boolean(editingRow);

  const form = useForm({
    resolver: yupResolver(buildSchema(isEdit)),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (!open) {
      form.reset(emptyValues);
      return;
    }
    if (editingRow) {
      form.reset({
        type: editingRow.type,
        code: editingRow.code,
        description: editingRow.description,
        cgst: String(editingRow.cgst),
        sgst: String(editingRow.sgst),
        igst: String(editingRow.igst),
      });
    } else {
      form.reset(emptyValues);
    }
  }, [open, editingRow, form]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        type: data.type,
        code: data.code.trim(),
        description: data.description.trim(),
        cgst: data.cgst.trim(),
        sgst: data.sgst.trim(),
        igst: data.igst.trim(),
      };
      if (isEdit) {
        const response = await updateMastersTaxCode(editingRow.tax_code_id, payload);
        return response.data;
      }
      const response = await createMastersTaxCode(payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masters", "tax-codes"] });
      onClose();
      toast.success(isEdit ? "Tax code updated" : "Tax code added");
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        (isEdit ? "Error updating tax code" : "Error adding tax code");
      error.message = message;
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-lg p-0"
        style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}
      >
        <DialogHeader className="flex-row justify-between px-4 py-2 border-b">
          <DialogTitle className="text-base">
            {isEdit ? "Edit tax code" : "Add tax code"}
          </DialogTitle>
          <DialogClose>
            <X size={20} />
          </DialogClose>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
            <MutationError mutation={saveMutation} />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="HSN">HSN (goods)</SelectItem>
                      <SelectItem value="SAC">SAC (services)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input {...field} inputMode="numeric" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-3">
              {["cgst", "sgst", "igst"].map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase">{name}</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="decimal" autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {isEdit ? "Save" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const taxCodeColumns = [
  { key: "sr_no", header: "Sr No", cell: (row) => row.sr_no },
  { key: "type", header: "Type", cell: (row) => row.type },
  { key: "code", header: "Code", cell: (row) => row.code },
  { key: "description", header: "Description", cell: (row) => row.description },
  { key: "cgst", header: "CGST", cell: (row) => formatRate(row.cgst) },
  { key: "sgst", header: "SGST", cell: (row) => formatRate(row.sgst) },
  { key: "igst", header: "IGST", cell: (row) => formatRate(row.igst) },
];

const TaxCodesTab = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["masters", "tax-codes", pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const response = await getMastersTaxCodes({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      });
      return response.data;
    },
  });

  const rows = (data?.tax_codes ?? []).map((row, index) => ({
    key: row.tax_code_id,
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

  const openAdd = () => {
    setEditingRow(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingRow(row);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRow(null);
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
        <Button variant="indigo" size="sm" onClick={openAdd}>
          <Plus className="size-4" />
          Add tax code
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
                  {taxCodeColumns.map((column) => (
                    <TableHead key={column.key}>{column.header}</TableHead>
                  ))}
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={taxCodeColumns.length + 1}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No tax codes yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.key}>
                      {taxCodeColumns.map((column) => (
                        <TableCell key={column.key}>
                          {column.cell(row)}
                        </TableCell>
                      ))}
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="hover:bg-accent rounded-full size-8 flex items-center justify-center"
                          aria-label="Edit tax code"
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
            <div>{totalCount} tax codes</div>
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

      <TaxCodeFormDialog open={dialogOpen} onClose={closeDialog} editingRow={editingRow} />
    </>
  );
};

export default TaxCodesTab;
