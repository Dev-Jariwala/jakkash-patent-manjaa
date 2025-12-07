import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BreadCrum from "@/components/breadcrum/BreadCrum";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProductsByCollectionId } from "@/services/products";
import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
import { useLocalStorage } from "@uidotdev/usehooks";
import { createStock, getStockById, updateStockById } from "@/services/stocks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import ReactSelect from "@/components/ui/react-select/react-select";
import { toast } from "react-toastify";
import { handleNumberInputChange } from "@/helper/formHelper";

const schema = yup.object().shape({
    product_id: yup.string().required("Product ID is required").typeError("Product ID is required"),
    date: yup.date().required("Date is required").typeError("Date is required"),
    quantity: yup.number().min(0, "Quantity must be at least 0").required("Quantity is required").typeError("Quantity is required"),
});

const StocksForm = () => {
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const formType = location.pathname.split("/")[2];
    const [searchParams] = useSearchParams();
    const stock_id = searchParams.get("stock_id");
    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            product_id: "",
            date: "",
            quantity: "",
        },
    });

    const { data: stock, isLoading, isError, error, } = useQuery({
        queryKey: ["stock", activeCollection, stock_id],
        queryFn: async () => {
            const res = await getStockById({ collection_id: activeCollection, stock_id });
            return res.data.stock;
        },
        enabled: !!activeCollection && !!stock_id && formType === "update",
    });
    const { data: products, isLoading: isProductsLoading, error: productsError } = useQuery({
        queryKey: ["products", activeCollection],
        queryFn: async () => {
            const response = await getProductsByCollectionId({ activeCollection, pagination: { pageIndex: -2 } });
            return response.data?.products || [];
        },
        enabled: !!activeCollection,
    });
    const productsOptions = useMemo(() => products?.map(product => ({ label: product?.product_name, value: product?.product_id })) || [], [products]);

    const createStockMutation = useMutation({
        mutationFn: async (data) => {
            return await createStock({ product_id: data.product_id, collection_id: activeCollection, data });
        },
        onSuccess: () => {
            navigate("/stocks");
            queryClient.invalidateQueries(["stocks", activeCollection]);
            toast.success("Stock created successfully");
        },
        onError: () => {
            toast.error("Error creating stock");
        }
    });
    const updateStockMutation = useMutation({
        mutationFn: async (data) => {
            return await updateStockById({ collection_id: activeCollection, product_id: data.product_id, stock_id, data });
        },
        onSuccess: () => {
            navigate("/stocks");
            queryClient.invalidateQueries(["stocks", activeCollection]);
            toast.success("Stock updated successfully");
        },
        onError: () => {
            toast.error("Error updating stock");
        }
    });
    const onSubmit = async (data) => {
        console.log({ data });
        if (formType === "new") {
            createStockMutation.mutate(data);
        } else if (formType === "update") {
            updateStockMutation.mutate(data);
        }
    };
    useEffect(() => {
        if (stock && stock?.collection_id === activeCollection) {
            form.reset({
                product_id: stock?.product_id,
                date: stock?.date,
                quantity: stock?.quantity,
            });
        }
    }, [stock, activeCollection]);

    useEffect(() => {
        if (productsError) {
            toast.error("Error fetching products");
        }
    }, [productsError]);

    if (stock && stock?.collection_id !== activeCollection) {
        return (
            <div className="text-center text-xl text-red-500 font-medium">
                This product does not belong to this collection.
            </div>
        );
    }
    return (
        <div className="">
            <div className="flex items-center justify-between px-5 border-b border-gray-200 py-4 mb-3">
                <div className="text-xl text-gray-700 font-semibold">
                    <BreadCrum
                        path={[
                            { path: "/", label: "Dashboard" },
                            { path: "/stocks", label: "Stocks" },
                            {
                                path: `/stocks/${formType}?stock_id=${stock_id}`,
                                label: `${formType}`,
                            },
                        ]}
                    />
                </div>
            </div>
            {isLoading || isProductsLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="basic-loader"></div>
                </div>
            ) : <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="w-full px-5"
                >
                    <div className=" grid lg:grid-cols-3 gap-5">
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Date <sup className="text-red-500 text-base -top-0">*</sup></FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full pl-3 text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(new Date(field.value), "PPP")
                                                    ) : (
                                                        <span>Pick a date</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="product_id"
                            render={({ field }) => (
                                <FormItem className="col-span-1">
                                    <FormLabel>
                                        Product <sup className="text-red-500 text-base -top-0">*</sup>
                                    </FormLabel>
                                    <FormControl>
                                        <ReactSelect
                                            options={productsOptions}
                                            placeholder=""
                                            value={productsOptions ? productsOptions.find((option) => option.value === field.value) : null}
                                            onChange={(e) => field.onChange(e.value)}
                                            onBlur={field.onBlur}
                                            isDisabled={formType === "update"}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem className="">
                                    <FormLabel>
                                        Quantity <sup className="text-red-500 text-base -top-0">*</sup>
                                    </FormLabel>
                                    <FormControl>
                                        <Input variant='ringShadow' {...field} onChange={(e) => handleNumberInputChange(e, field)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="w-full mt-5">
                        <MutationError mutation={createStockMutation} />
                        {isError && !isLoading && (
                            <QueryError className={"mb-5"} error={error} />
                        )}
                        <Button variant="" disabled={createStockMutation?.isPending || updateStockMutation.isPending} isLoading={createStockMutation?.isPending || updateStockMutation.isPending} loadingText={formType === 'update' ? 'updating...' : 'creating...'} className="bg-indigo-500 hover:bg-indigo-600" type="submit">
                            {stock_id && formType === "update" ? "Update" : "Create"}{" "}
                            Stock
                        </Button>
                    </div>
                </form>{" "}
            </Form>}
        </div>
    );
};

export default StocksForm;
