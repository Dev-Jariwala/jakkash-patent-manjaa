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
            <DialogContent className="sm:tw-max-w-3xl tw-p-0 " style={{ fontFamily: 'Nunito, "Segoe UI", arial' }}>
                <DialogHeader className='tw-flex-row tw-justify-between tw-px-4 tw-py-2 tw-border-b'>
                    <DialogTitle className='tw-text-base'>Add Stock</DialogTitle>
                    <DialogClose>
                        <X size={20} />
                    </DialogClose>
                </DialogHeader>
                <div className="tw-px-5 tw-pb-10 tw-pt-5">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="tw-w-full tw-px-5"
                        >
                            <div className=" tw-grid lg:tw-grid-cols-3 tw-gap-5">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>Date <sup className="tw-text-red-500 tw-text-base -tw-top-0">*</sup></FormLabel>
                                            <FormControl>
                                                <Popover className="tw-relative">
                                                    {({ open }) => (
                                                        <>
                                                            <PopoverButton className="tw-inline-flex tw-w-full tw-items-center tw-justify-between tw-rounded-md tw-text-sm tw-font- tw-ring-offset-background tw-transition-colors tw-border tw-border-input tw-bg-background hover:tw-bg-accent tw-text-gray-600 tw-py-2 tw-px-3">
                                                                {field.value ? format(field.value, "dd/MM/yyyy") : <span className='tw-text-gray-400'> </span>}
                                                                <CalendarDays size={16} />
                                                            </PopoverButton>
                                                            <Transition as={Fragment} show={open} enter="tw-transition tw-ease-out tw-duration-100" enterFrom="tw-opacity-0 tw-translate-y-1" enterTo="tw-opacity-100 tw-translate-y-0" leave="tw-transition tw-ease-in tw-duration-75" leaveFrom="tw-opacity-100 tw-translate-y-0" leaveTo="tw-opacity-0 tw-translate-y-1">
                                                                <PopoverPanel className="tw-absolute tw-bg-white tw-left-1/2 tw-z-10 tw-mt-2 tw-max-w-sm tw--translate-x-1/2 tw-transform tw-rounded-md">
                                                                    <div className="tw-border tw-border-solid tw-border-[#ddd] tw-px-2 tw-py-1 tw-rounded-md">
                                                                        <div className="tw-float-right tw-mr-2 tw-cursor-pointer">
                                                                            <svg width="16" height="16" fill="currentColor"></svg>
                                                                        </div>
                                                                        <div className="tw-box-border">
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
                                        <FormItem className="tw-col-span-1">
                                            <FormLabel>
                                                Product <sup className="tw-text-red-500 tw-text-base -tw-top-0">*</sup>
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
                                                Quantity <sup className="tw-text-red-500 tw-text-base -tw-top-0">*</sup>
                                            </FormLabel>
                                            <FormControl>
                                                <Input variant='ringShadow' {...field} onChange={(e) => handleNumberInputChange(e, field)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="tw-w-full tw-mt-5">
                                <MutationError mutation={createStockMutation} />
                                <Button variant="" disabled={createStockMutation?.isPending} isLoading={createStockMutation?.isPending} loadingText={'creating...'} className="tw-bg-indigo-500 hover:tw-bg-indigo-600" type="submit">
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