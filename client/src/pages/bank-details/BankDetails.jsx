import BreadCrum from "@/components/breadcrum/BreadCrum";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getShopBankAccount,
  saveShopBankAccount,
} from "@/services/shopBankAccount";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { RequiredMark } from "@/components/form/RequiredMark";

const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const schema = yup.object().shape({
  bank_name: yup
    .string()
    .trim()
    .required("Bank name is required")
    .max(120, "Bank name is too long"),
  bank_address: yup
    .string()
    .trim()
    .required("Bank address is required")
    .max(255, "Bank address is too long"),
  account_number: yup
    .string()
    .trim()
    .required("Account number is required")
    .matches(/^\d{9,18}$/, "Account number must be 9 to 18 digits"),
  ifsc: yup
    .string()
    .trim()
    .required("IFSC is required")
    .test(
      "ifsc",
      "IFSC must be the standard 11-character IFSC",
      (value) => {
        if (!value) {
          return true;
        }
        if (/\s/.test(value)) {
          return false;
        }
        return IFSC_PATTERN.test(value.toUpperCase());
      }
    ),
});

const emptyValues = {
  bank_name: "",
  bank_address: "",
  account_number: "",
  ifsc: "",
};

const BankDetails = () => {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: emptyValues,
  });

  const {
    data: accountResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["shopBankAccount"],
    queryFn: async () => {
      const res = await getShopBankAccount();
      return res.data;
    },
  });

  useEffect(() => {
    const account = accountResponse?.shop_bank_account;
    if (account) {
      form.reset({
        bank_name: account.bank_name,
        bank_address: account.bank_address,
        account_number: account.account_number,
        ifsc: account.ifsc,
      });
    } else if (accountResponse && !account) {
      form.reset(emptyValues);
    }
  }, [accountResponse, form]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await saveShopBankAccount({
        bank_name: data.bank_name.trim(),
        bank_address: data.bank_address.trim(),
        account_number: data.account_number.trim(),
        ifsc: data.ifsc.trim().toUpperCase(),
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["shopBankAccount"], data);
      form.reset({
        bank_name: data.shop_bank_account.bank_name,
        bank_address: data.shop_bank_account.bank_address,
        account_number: data.shop_bank_account.account_number,
        ifsc: data.shop_bank_account.ifsc,
      });
      toast.success("Bank details saved");
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || "Failed to save bank details";
      err.message = message;
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    saveMutation.mutate(data);
  };

  return (
    <div>
      <div className="flex items-center justify-between px-5 border-b border-border py-3 mb-3">
        <div className="text-xl text-foreground font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/bank-details", label: "Bank details" },
            ]}
          />
        </div>
      </div>

      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="basic-loader"></div>
          </div>
        ) : isError ? (
          <QueryError error={error} />
        ) : (
          <div className="max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Bank details
            </h2>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
                style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}
              >
                <MutationError mutation={saveMutation} />
                <FormField
                  control={form.control}
                  name="bank_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Bank name
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bank_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Bank address
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="account_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Account number
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" inputMode="numeric" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ifsc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        IFSC
                        <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="off" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="pt-2">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankDetails;
