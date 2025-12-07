/* eslint-disable react/prop-types */
// import { Dialog, DialogContent } from "@/components/ui/dialog"
import MutationError from "@/components/Errors/MutationError";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import ReactSelect from "@/components/ui/react-select/react-select";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/tremor-dialog"
import { handleNumberInputChange } from "@/helper/formHelper";
import { getProductsByCollectionId } from "@/services/products";
import { createStock } from "@/services/stocks";
import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalStorage } from "@uidotdev/usehooks";
import { addDays, format } from "date-fns";
import { CalendarDays, X } from "lucide-react"
import { Fragment, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import * as yup from "yup";

const schema = yup.object().shape({
    product_id: yup.string().required("Product ID is required").typeError("Product ID is required"),
    date: yup.date().required("Date is required").typeError("Date is required"),
    quantity: yup.number().min(0, "Quantity must be at least 0").required("Quantity is required").typeError("Quantity is required"),
});

const AddStockModal = ({ open, onClose }) => {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [activeCollection] = useLocalStorage("activeCollection");
    const product_id = searchParams.get("product_id");

    const form = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            product_id,
            date: "",
            quantity: "",
        },
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
        onSuccess: (res) => {
            // console.log({ data: res.data });
            // queryClient.setQueryData(['products', activeCollection], (oldData) => {
            //     if (!oldData) return; // If no previous data, return
            //     console.log({ oldData });
            //     const updatedProducts = oldData.map(product => {
            //         if (product.product_id === res.data.product.product_id) {
            //             return res.data.product;
            //         }
            //         return product;
            //     });
            //     return updatedProducts;
            // })
            queryClient.invalidateQueries({ queryKey: ["products", activeCollection] });
            onClose();
            toast.success("Stock created successfully");
        },
        onError: () => {
            toast.error("Error creating stock");
        }
    });

    const onSubmit = async (data) => {
        createStockMutation.mutate(data);
    };

    useEffect(() => {
        if (productsError) {
            toast.error("Error fetching products");
        }
    }, [productsError]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl p-0 " style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}>
                <DialogHeader className='flex-row justify-between px-4 py-2 border-b'>
                    <DialogTitle className='text-base'>Add Stock</DialogTitle>
                    <DialogClose>
                        <X size={20} />
                    </DialogClose>
                </DialogHeader>
                <div className="px-5 pb-10 pt-5">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="w-full px-5"
                        >
                            <div className=" grid lg:grid-cols-3 gap-5">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>Date <sup className="text-red-500 text-base -top-0">*</sup></FormLabel>
                                            <FormControl>
                                                <Popover className="relative">
                                                    {({ open }) => (
                                                        <>
                                                            <PopoverButton className="inline-flex w-full items-center justify-between rounded-md text-sm font- ring-offset-background transition-colors border border-input bg-background hover:bg-accent text-gray-600 py-2 px-3">
                                                                {field.value ? format(field.value, "dd/MM/yyyy") : <span className='text-gray-400'> </span>}
                                                                <CalendarDays size={16} />
                                                            </PopoverButton>
                                                            <Transition as={Fragment} show={open} enter="transition ease-out duration-100" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-75" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
                                                                <PopoverPanel className="absolute bg-white left-1/2 z-10 mt-2 max-w-sm -translate-x-1/2 transform rounded-md">
                                                                    <div className="border border-solid border-[#ddd] px-2 py-1 rounded-md">
                                                                        <div className="float-right mr-2 cursor-pointer">
                                                                            <svg width="16" height="16" fill="currentColor"></svg>
                                                                        </div>
                                                                        <div className="box-border">
                                                                            <Calendar
                                                                                mode="single"
                                                                                selected={field.value}
                                                                                onSelect={(date) => {
                                                                                    if (date) {
                                                                                        field.onChange(date);
                                                                                    } else {
                                                                                        field.onChange(null);
                                                                                    }
                                                                                }}
                                                                                initialFocus
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </PopoverPanel>
                                                            </Transition>
                                                        </>
                                                    )}
                                                </Popover>
                                            </FormControl>

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
                                                    isDisabled
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
                                <Button variant="" disabled={createStockMutation?.isPending} isLoading={createStockMutation?.isPending} loadingText={'creating...'} className="bg-indigo-500 hover:bg-indigo-600" type="submit">
                                    Create Stock
                                </Button>
                            </div>
                        </form>{" "}
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AddStockModal