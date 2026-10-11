import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BreadCrum from "@/components/breadcrum/BreadCrum";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  getProductById,
  updateProductById,
} from "@/services/products";
import { getAllMastersTaxCodes } from "@/services/common";
import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
import { useLocalStorage } from "@uidotdev/usehooks";
import { handleDecimalInputChange } from "@/helper/formHelper";
import { toast } from "react-toastify";

const schema = yup.object().shape({
  product_name: yup.string().required("Product Name is required"),
  wholesale_price: yup
    .number()
    .min(0, "Wholesale Price must be at least 0")
    .required("Wholesale Price is required")
    .typeError("Wholesale Price is required"),
  retail_price: yup
    .number()
    .min(0, "Wholesale Price must be at least 0")
    .required("Retail Price is required")
    .typeError("Retail Price is required"),
  is_labour: yup
    .string()
    .oneOf(["0", "1"], "Select a category")
    .typeError("Select a category"),
  tax_code_id: yup.string().required("HSN/SAC is required"),
});

function taxCodeOptionLabel(taxCode) {
  return `${taxCode.type} ${taxCode.code} — ${taxCode.description}`;
}

const ProductForm = () => {
  const [activeCollection] = useLocalStorage("activeCollection", null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const formType = location.pathname.split("/")[2];
  const [searchParams] = useSearchParams();
  const product_id = searchParams.get("product_id");
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      product_name: "",
      retail_price: "",
      wholesale_price: "",
      is_labour: "0",
      tax_code_id: "",
    },
  });

  const isLabour = form.watch("is_labour");

  const { data: taxCodes = [] } = useQuery({
    queryKey: ["masters", "tax-codes", "product-form"],
    queryFn: () => getAllMastersTaxCodes(),
  });

  const taxCodeOptions = useMemo(() => {
    const expectedType = isLabour === "1" ? "SAC" : "HSN";
    return taxCodes.filter((row) => row.type === expectedType);
  }, [taxCodes, isLabour]);

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ["product", activeCollection, product_id],
    queryFn: async () => {
      const res = await getProductById({ activeCollection, product_id });
      return res.data.product;
    },
    enabled: !!activeCollection && !!product_id && formType === "update",
  });

  const createProductMutation = useMutation({
    mutationFn: async (data) => {
      return await createProduct({ activeCollection, data });
    },
    onSuccess: () => {
      navigate("/products");
      queryClient.invalidateQueries(["products", activeCollection]);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || "Error creating product";
      err.message = message;
      toast.error(message);
    },
  });
  const updateProductMutation = useMutation({
    mutationFn: async (data) => {
      return await updateProductById({ activeCollection, product_id, data });
    },
    onSuccess: () => {
      navigate("/products");
      queryClient.invalidateQueries(["products", activeCollection]);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message || "Error updating product";
      err.message = message;
      toast.error(message);
    },
  });

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      is_labour: Number(data.is_labour),
    };
    if (formType === "new") {
      createProductMutation.mutate(payload);
    } else if (formType === "update") {
      updateProductMutation.mutate(payload);
    }
  };

  useEffect(() => {
    if (product && product?.collection_id === activeCollection) {
      form.reset({
        collection_id: activeCollection || null,
        product_name: product?.product_name,
        retail_price: product?.retail_price,
        wholesale_price: product?.wholesale_price,
        is_labour: product?.is_labour ? "1" : "0",
        tax_code_id: product?.tax_code_id ?? "",
      });
    }
  }, [product, product_id, activeCollection, form]);

  useEffect(() => {
    const selectedId = form.getValues("tax_code_id");
    if (!selectedId) {
      return;
    }
    const selected = taxCodes.find((row) => row.tax_code_id === selectedId);
    const expectedType = isLabour === "1" ? "SAC" : "HSN";
    if (selected && selected.type !== expectedType) {
      form.setValue("tax_code_id", "", { shouldValidate: true });
    }
  }, [isLabour, taxCodes, form]);

  if (product && product?.collection_id !== activeCollection) {
    return (
      <div className="text-center text-xl text-red-500 font-medium">
        This product does not belong to this collection.
      </div>
    );
  }
  return (
    <div className="">
      <div className="flex items-center justify-between px-5 border-b border-border py-4 mb-3">
        <div className="text-xl text-foreground font-semibold">
          <BreadCrum
            path={[
              { path: "/", label: "Dashboard" },
              { path: "/products", label: "Products" },
              {
                path: `/products/${formType}?product_id=${product_id}`,
                label: `${formType}`,
              },
            ]}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="basic-loader"></div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full px-5">
            <div className="grid lg:grid-cols-3 gap-5">
              <FormField
                control={form.control}
                name="product_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input className="truncate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wholesale_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wholesale Price</FormLabel>
                    <FormControl>
                      <Input
                        className=""
                        {...field}
                        onChange={(e) => handleDecimalInputChange(e, field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="retail_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Retail Price</FormLabel>
                    <FormControl>
                      <Input
                        className=""
                        {...field}
                        onChange={(e) => handleDecimalInputChange(e, field)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tax_code_id"
                render={({ field }) => (
                  <FormItem className="order-5 lg:order-4">
                    <FormLabel>HSN/SAC</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          className="w-full min-w-0 h-10 max-h-10 overflow-hidden [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate [&>span:first-child]:text-left"
                        >
                          <SelectValue placeholder="Select HSN/SAC" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[min(100vw-2rem,var(--radix-select-trigger-width))]">
                          {taxCodeOptions.map((row) => (
                            <SelectItem
                              key={row.tax_code_id}
                              value={row.tax_code_id}
                              className="truncate"
                              title={taxCodeOptionLabel(row)}
                            >
                              {taxCodeOptionLabel(row)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_labour"
                render={({ field }) => (
                  <FormItem className="order-4 lg:order-5">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select value={String(field.value)} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full lg:w-[180px]">
                          <SelectValue placeholder="Collection" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Product</SelectItem>
                          <SelectItem value="1">Labour</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="w-full mt-5">
              <MutationError mutation={createProductMutation} />
              <MutationError mutation={updateProductMutation} />
              {isError && !isLoading && (
                <QueryError className={"mb-5"} error={error} />
              )}
              <Button
                variant=""
                disabled={
                  createProductMutation?.isPending || updateProductMutation?.isPending
                }
                isLoading={
                  createProductMutation?.isPending || updateProductMutation?.isPending
                }
                loadingText={formType === "update" ? "updating..." : "creating..."}
                className="bg-indigo-500 hover:bg-indigo-600"
                type="submit"
              >
                {product_id && formType === "update" ? "Update" : "Create"} Product
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};

export default ProductForm;
