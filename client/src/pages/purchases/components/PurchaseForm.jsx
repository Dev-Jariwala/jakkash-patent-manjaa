import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
// import Select from "react-select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BreadCrum from "@/components/breadcrum/BreadCrum";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import MutationError from "@/components/Errors/MutationError";
import QueryError from "@/components/Errors/QueryError";
import { useLocalStorage } from "@uidotdev/usehooks";
import { createPurchase, getPurchaseById, updatePurchase } from "@/services/purchases";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { handleDecimalInputChange, handleNumberInputChange } from "@/helper/formHelper";
const schema = yup.object().shape({
    purchase_date: yup.date().required("Purchase Date is required").typeError("Purchase Date is required"),
    invoice_no: yup.string().required("Invoice Number is required"),
    supplier_name: yup.string().required("Supplier Name is required"),
    item_description: yup.string(),
    rate: yup.number().min(0, 'Rate must be at least 0').required("Rate is required").typeError("Rate is required"),
    quantity: yup.number().min(0, 'Quantity must be at least 0').required("Quantity is required").typeError("Quantity is required"),
});

const PurchaseForm = () => {
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const formType = location.pathname.split("/")[2];
    const [searchParams] = useSearchParams();
    const purchase_id = searchParams.get("purchase_id");
    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            purchase_date: "",
            invoice_no: "",
            supplier_name: "",
            item_description: "",
            rate: "",
            quantity: "",
        },
    });

    const { data: purchase, isLoading, isError, error, } = useQuery({
        queryKey: ["purchases", activeCollection, purchase_id],
        queryFn: async () => {
            const res = await getPurchaseById({ activeCollection, purchase_id });
            return res.data.purchase;
        },
        enabled: !!activeCollection && !!purchase_id && formType === "update",
    });

    const createPurchaseMutation = useMutation({
        mutationFn: createPurchase,
        onSuccess: () => {
            navigate("/purchases");
            queryClient.invalidateQueries(["purchases", activeCollection]);
        },
    });
    const updatePurchaseMutation = useMutation({
        mutationFn: updatePurchase,
        onSuccess: () => {
            navigate("/purchases");
            queryClient.invalidateQueries(["purchases", activeCollection]);
        },
    });
    const onSubmit = async (data) => {
        if (formType === "new") {
            createPurchaseMutation.mutate({ data, collection_id: activeCollection });
        } else if (formType === "update") {
            updatePurchaseMutation.mutate({ data, collection_id: activeCollection, purchase_id });
        }
    };
    useEffect(() => {
        if (purchase && purchase?.collection_id === activeCollection) {
            console.log(purchase);
            form.reset({
                purchase_date: purchase?.purchase_date,
                invoice_no: purchase?.invoice_no,
                supplier_name: purchase?.supplier_name,
                item_description: purchase?.item_description,
                rate: purchase?.rate,
                quantity: purchase?.quantity
            });
        }
    }, [purchase, purchase_id, activeCollection]);

    if (purchase && purchase?.collection_id !== activeCollection) {
        return (
            <div className="text-center text-xl text-red-500 font-medium">
                This purchase does not belong to this collection.
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
                            { path: "/purchases", label: "Purchases" },
                            {
                                path: `/purchase/${formType}?purchase_id=${purchase_id}`,
                                label: `${formType}`,
                            },
                        ]}
                    />
                </div>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
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
                            name="purchase_date"
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
                                                        format(field.value, "PPP")
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
                            name="invoice_no"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Invoice No <sup className="text-red-500 text-base -top-0">*</sup></FormLabel>
                                    <FormControl>
                                        <Input className="" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="supplier_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Supplier Name <sup className="text-red-500 text-base -top-0">*</sup></FormLabel>
                                    <FormControl>
                                        <Input className="" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rate <sup className="text-red-500 text-base -top-0">*</sup></FormLabel>
                                    <FormControl>
                                        <Input className="" {...field} onChange={e => handleDecimalInputChange(e, field)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantity"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantity <sup className="text-red-500 text-base -top-0">*</sup></FormLabel>
                                    <FormControl>
                                        <Input className="" {...field} onChange={e => handleNumberInputChange(e, field)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="item_description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Description</FormLabel>
                                    <FormControl>
                                        <Textarea className="bg-white" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="w-full mt-5">
                        <MutationError mutation={createPurchaseMutation} />
                        {isError && !isLoading && (
                            <QueryError className={"mb-5"} error={error} />
                        )}
                        <Button variant="" disabled={createPurchaseMutation.isPending || updatePurchaseMutation.isPending} isLoading={createPurchaseMutation.isPending || updatePurchaseMutation.isPending} loadingText={formType === 'update' ? 'updating...' : 'creating...'} className="bg-indigo-500 hover:bg-indigo-600" type="submit">
                            {purchase_id && formType === "update" ? "Update" : "Create"}{" "}
                            Purchase
                        </Button>
                    </div>
                </form>{" "}
            </Form>}
        </div>
    );
};

export default PurchaseForm;
