import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BreadCrum from "@/components/breadcrum/BreadCrum";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"; import { getProductsByCollectionId } from "@/services/products";
import MutationError from "@/components/Errors/MutationError";
import { useLocalStorage } from "@uidotdev/usehooks";
import { toast } from "react-toastify";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactSelect from "@/components/ui/react-select/react-select";
import { Textarea } from "@/components/ui/textarea";
import { createOrder, getOrderById, getNextOrderNo, updateOrderById } from "@/services/orders";
import { getWhatsAppServiceSetting } from "@/services/settings";
import { handleDecimalInputChange, handleNumberInputChange, productNamesOrder, sortProductsByNames } from "@/helper/formHelper";
import { getClientByMobileNumber } from "@/services/clients";
import AddStockModal from "./AddStockModal";
import { Checkbox } from "@/components/ui/checkbox";
import SendUpdatedBillDialog from "@/components/bills/SendUpdatedBillDialog";
import WhatsAppEditLockNotice from "@/components/bills/WhatsAppEditLockNotice";
import {
    canResendWhatsAppDelivery,
    EDIT_LOCK_REASON,
    getWhatsAppDeliveryPollIntervalMs,
    isBillLockedForEditing,
    shouldPollWhatsAppDeliveryStatus,
} from "@/lib/whatsappDelivery";
import { BILL_NUMBER_LABEL } from "@jakkash/bill-pdf";

const BillsForm = () => {
    const { order_id } = useParams();
    const [activeCollection] = useLocalStorage("activeCollection", null);
    const [searchParams] = useSearchParams();
    const orderType = searchParams.get("order_type");
    const product_id = searchParams.get("product_id");
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const formType = location.pathname.split("/")[2];
    // Bill awaiting the operator's "send the updated order?" answer (PRD 31).
    const [orderPendingSendDecision, setBillPendingSendDecision] = useState(null);
    const whatsappPollIntervalMs = getWhatsAppDeliveryPollIntervalMs();
    const { data: bill, isLoading: isBillLoading, error: billError } = useQuery({
        queryKey: ["order", activeCollection, order_id],
        queryFn: async () => {
            const response = await getOrderById({ collection_id: activeCollection, order_id });
            return { ...response.data?.order, order_items: response.data?.orderItems } || {};
        },
        enabled: !!activeCollection && !!order_id,
        // A delivery that finishes on its own unlocks the form without the
        // operator having to reload it.
        refetchInterval: (query) =>
            shouldPollWhatsAppDeliveryStatus(query.state.data)
                ? whatsappPollIntervalMs
                : false,
    });
    const schema = yup.object().shape({
        order_no: yup.number().required(`${BILL_NUMBER_LABEL} is required`).typeError(`${BILL_NUMBER_LABEL} is required`),
        mobile: yup.number().required("Mobile is required").typeError("Mobile is required").test('len', 'Mobile must be exactly 10 digits', val => val.toString().length === 10),
        name: yup.string().required("Name is required"),
        address: yup.string().required("Address is required"),
        order_date: yup.date().required("Order Date is required").typeError("Order Date is required"),
        delivery_date: yup.date().required("Delivery Date is required").typeError("Delivery Date is required"),
        products: yup.array().of(
            yup.object().shape({
                product_id: yup.string().required("Product is required"),
                stock_in_hand: yup.number().required("Stock in hand is required").typeError("Stock in hand is required"),
                quantity: yup.number().optional().typeError("Quantity is required")
                    .test('maxQuantity', 'Quantity must be less than or equal to stock.', function (value) {
                        const { stock_in_hand, product_id } = this.parent;
                        const billItem = bill?.order_items?.find(item => item.product_id === product_id);
                        const maxQuantity = formType === 'update' && billItem ? stock_in_hand + billItem.quantity : stock_in_hand;
                        return value <= maxQuantity;
                    }),
                price: yup.number().required("Price is required").typeError("Price is required"),
            })
        ),
        notes: yup.string().optional(),
        total_firki: yup.number().min(0, 'Total firki must be at least zero.').required("Total Firki is required").typeError("Total Firki is required"),
        sub_total: yup.number().min(1, 'Sub Total must be at least one.').required("Sub Total is required").typeError("Sub Total is required")
            .test('sum', 'Sub Total must be equal to Discount + Advance + Total Due', function (value) {
                const { discount, advance, total_due, products } = this.parent;
                const estimatedSubTotal = products.reduce((acc, product) => acc + product.price * product.quantity, 0);
                return value === (discount + advance + total_due) && value === estimatedSubTotal;
            }),
        discount: yup.number().min(0, 'Discount must be at least zero.').required("Discount is required").typeError("Discount is required")
            .test('sum', 'Discount + Advance + Total Due must be equal to Sub Total', function (value) {
                const { sub_total, advance, total_due } = this.parent;
                return sub_total === (value + advance + total_due);
            }),
        advance: yup.number().min(0, 'Advance must be at least zero.').required("Advance is required").typeError("Advance is required")
            .test('sum', 'Discount + Advance + Total Due must be equal to Sub Total', function (value) {
                const { sub_total, discount, total_due } = this.parent;
                return sub_total === (discount + value + total_due);
            }),
        total_due: yup.number().min(0, 'Total Due must be at least zero.').required("Total Due is required").typeError("Total Due is required")
            .test('sum', 'Discount + Advance + Total Due must be equal to Sub Total', function (value) {
                const { sub_total, discount, advance } = this.parent;
                return sub_total === (discount + advance + value);
            }),
        is_delivered: yup.boolean().optional(),
        send_order_on_whatsapp: yup.boolean().optional(),
    });
    // const order_id = searchParams.get("order_id");
    const form = useForm({
        mode: "onChange", // Validate as the user types
        reValidateMode: "onBlur",
        resolver: yupResolver(schema),
        defaultValues: {
            order_no: null,
            mobile: "",
            name: "",
            address: "",
            order_date: "",
            delivery_date: "",
            products: [],
            notes: "",
            total_firki: "",
            sub_total: 0,
            discount: 0,
            advance: 0,
            total_due: 0,
            is_delivered: false,
            send_order_on_whatsapp: true,
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
    const { data: nextOrderNo, isLoading: isNextBillNoLoading, error: nextOrderNoError } = useQuery({
        queryKey: ["nextOrderNo", activeCollection],
        queryFn: async () => {
            const response = await getNextOrderNo({ collection_id: activeCollection, order_type: orderType });
            return response.data?.order_no;
        },
        enabled: !!activeCollection && formType === "new",
    });
    const { data: whatsappServiceSetting, isError: isWhatsAppServiceSettingError, error: whatsappServiceSettingError } = useQuery({
        queryKey: ["whatsappServiceSetting"],
        queryFn: async () => {
            const response = await getWhatsAppServiceSetting();
            return response.data;
        },
    });
    const whatsappServiceEnabled = !isWhatsAppServiceSettingError && !!whatsappServiceSetting?.whatsapp_service_enabled;
    // Only the update path can be locked; a bill being created has no delivery yet.
    const isEditLocked = formType === "update" && isBillLockedForEditing(bill);
    const mobile = form.watch("mobile");
    const { data: clientDetails, isLoading: isClientDetailsLoading, error: clientDetailsError } = useQuery({
        queryKey: ["clientDetails", mobile],
        queryFn: async () => {
            const response = await getClientByMobileNumber(mobile);
            return response.data?.client || {};
        },
        enabled: mobile?.length === 10,
    });
    const productsOptions = useMemo(() => products?.filter(product => product?.[`${orderType}_price`] > 0)?.map(product => ({ label: product?.product_name, value: product?.product_id })) || [], [products]);

    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: (res) => {
            navigate(`/orders/${orderType}?order_id=${res.data?.order?.order_id}`);
            queryClient.invalidateQueries(["bills", activeCollection]);
            toast.success("Order created successfully");
            if (res.data?.whatsapp_delivery?.queued === false) {
                toast.warn(
                    res.data.whatsapp_delivery.warning ||
                    "Order was created, but WhatsApp delivery could not be queued."
                );
            }
        },
        onError: (error) => {
            toast.error(`Error Creating order: ${error.message}`);
        },
    });

    const updateOrderMutation = useMutation({
        mutationFn: updateOrderById,
        onSuccess: (res) => {
            const updatedOrder = res.data?.order;
            queryClient.invalidateQueries(["bills", activeCollection]);
            toast.success("Order updated successfully");

            // Resending after an edit stays an explicit choice (PRD 31). Asking
            // only when the answer can actually be acted on keeps the ordinary
            // update flow unchanged whenever delivery is unavailable.
            if (whatsappServiceEnabled && canResendWhatsAppDelivery(updatedOrder)) {
                setBillPendingSendDecision(updatedOrder);
                return;
            }

            navigate(`/orders/${orderType}?order_id=${updatedOrder?.order_id}`);
        },
        onError: (error) => {
            const response = error?.response?.data;
            // A delivery enqueued since the form loaded lands here; pulling the
            // bill back in raises the lock notice with its force-cancel path.
            if (response?.code === "WHATSAPP_DELIVERY_IN_PROGRESS") {
                queryClient.invalidateQueries({ queryKey: ["order"] });
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                toast.error(response.message || EDIT_LOCK_REASON);
                return;
            }
            toast.error(`Error updating order: ${response?.message || error.message}`);
        },
    })

    const handleSendDecisionDone = () => {
        if (!orderPendingSendDecision) return;
        const decidedBillId = orderPendingSendDecision.order_id;
        setBillPendingSendDecision(null);
        navigate(`/orders/${orderType}?order_id=${decidedBillId}`);
    };

    const onSubmit = async (data) => {
        if (createOrderMutation.isPending || updateOrderMutation.isPending) return;
        if (isEditLocked) {
            toast.error(EDIT_LOCK_REASON);
            return;
        }
        const filteredProducts = data.products.filter(product => product.quantity > 0);
        data.order_items = filteredProducts;
        data.order_no = formType === 'new' ? nextOrderNo : data.order_no;
        data.order_type = orderType;
        data.mobile = data.mobile.toString();
        if (formType === "new") {
            if (!whatsappServiceEnabled) {
                delete data.send_order_on_whatsapp;
            }
            createOrderMutation.mutate({ collection_id: activeCollection, data });
        } else {
            delete data.send_order_on_whatsapp;
            console.log({ data });
            updateOrderMutation.mutate({ collection_id: activeCollection, order_id, data });
        }
    };

    useEffect(() => {
        const oldsProducts = form.getValues('products');
        const showProducts = products?.filter(product => product?.[`${orderType}_price`] > 0)?.map(product => {
            const oldProd = oldsProducts?.find(p => p.product_id === product?.product_id);
            return ({ product_id: product?.product_id, product_name: product?.product_name, is_labour: product?.is_labour, quantity: oldProd?.quantity || 0, price: product[`${orderType}_price`], stock_in_hand: product?.stock_in_hand, total: oldProd?.total || 0 })
        }) || [];
        form.setValue('products', sortProductsByNames(showProducts, productNamesOrder));
    }, [products, orderType]);

    useEffect(() => {
        if (formType === 'update' && bill) {
            form.setValue('order_no', bill.order_no);
            form.setValue('mobile', bill.mobile);
            form.setValue('name', bill.name);
            form.setValue('address', bill.address);
            form.setValue('order_date', new Date(bill.order_date));
            form.setValue('delivery_date', new Date(bill.delivery_date));
            const showProducts = products?.filter(product => product?.[`${bill.order_type}_price`] > 0)?.map(product => {
                console.log({ product, bill });
                const billItem = bill.order_items.find(item => item.product_id === product.product_id);
                const price = product[`${bill.order_type}_price`];
                const quantity = billItem?.quantity || 0;
                return {
                    product_id: product.product_id,
                    product_name: product.product_name,
                    stock_in_hand: product.stock_in_hand,
                    is_labour: product?.is_labour,
                    price,
                    quantity,
                    total: (price * quantity).toFixed(2),
                };
            }) || [];
            // console.log({ showProducts });
            form.setValue('products', sortProductsByNames(showProducts, productNamesOrder));
            form.setValue('notes', bill.notes);
            form.setValue('total_firki', bill.total_firki);
            form.setValue('sub_total', bill.sub_total);
            form.setValue('discount', bill.discount);
            form.setValue('advance', bill.advance);
            form.setValue('total_due', bill.total_due);
            form.setValue('is_delivered', bill.delivered_at ? true : false);
        }
    }, [bill, formType, products]);

    useEffect(() => {
        if (formType === 'new' && nextOrderNo) {
            form.setValue('order_no', nextOrderNo);
            form.trigger('order_no');
        }
    }, [nextOrderNo, form]);

    useEffect(() => {
        if (productsError) {
            toast.error(`Error getting products: ${productsError.message}`);
        }
        if (nextOrderNoError) {
            toast.error(`Error getting next ${BILL_NUMBER_LABEL.toLowerCase()}: ${nextOrderNoError.message}`);
        }
        if (billError) {
            toast.error(`Error getting order: ${billError.message}`);
        }
        if (clientDetailsError) {
            toast.error(`Error getting client details: ${clientDetailsError.message}`);
        }
        if (whatsappServiceSettingError) {
            toast.error(`Could not load WhatsApp service setting: ${whatsappServiceSettingError.message}`);
        }
    }, [productsError, nextOrderNoError, billError, clientDetailsError, whatsappServiceSettingError]);

    useEffect(() => {
        if (clientDetails?.name && clientDetails?.address) {
            form.setValue('name', clientDetails.name);
            form.setValue('address', clientDetails.address);
        }
    }, [clientDetails])
    return (
        <>
            {product_id && <AddStockModal open={!!product_id} onClose={() => navigate(-1)} />}
            {orderPendingSendDecision && (
                <SendUpdatedBillDialog
                    bill={orderPendingSendDecision}
                    collectionId={activeCollection}
                    open
                    onDone={handleSendDecisionDone}
                />
            )}
            {isProductsLoading || isNextBillNoLoading || isBillLoading ?
                <div className="flex justify-center items-center h-64">
                    <div className="basic-loader"></div>
                </div> :
                <div className="">
                    <div className="flex items-center justify-between px-5 border-b border-border py-4 mb-3">
                        <div className="text-xl text-foreground font-semibold">
                            <BreadCrum
                                path={[
                                    { path: "/", label: "Dashboard" },
                                    { path: "/orders", label: "Orders" },
                                    {
                                        path: `/orders/${orderType}`,
                                        label: `${formType}`,
                                    },
                                ]}
                            />
                        </div>
                    </div>
                    {isEditLocked && <WhatsAppEditLockNotice bill={bill} collectionId={activeCollection} />}
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="w-full px-5"
                        >
                            <div className="grid lg:grid-cols-3 gap-5">
                                <div className="">
                                    <FormField
                                        control={form.control}
                                        name="order_no"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{BILL_NUMBER_LABEL}</FormLabel>
                                                <FormControl>
                                                    <Input className="" {...field} disabled />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            <div className=" grid lg:grid-cols-3 gap-5 mt-5">
                                <FormField
                                    control={form.control}
                                    name="mobile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mobile</FormLabel>
                                            <FormControl>
                                                <Input className="" {...field} onChange={(e) => handleNumberInputChange(e, field)} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input className="" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input className="" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="order_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date</FormLabel>
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
                                    name="delivery_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Delivery Date</FormLabel>
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
                            </div>
                            <div className="mt-5">
                                <div className="grid gap-4 mt-2">
                                    <div className="grid grid-cols-5 gap-5 bg-muted py-3 px-5">
                                        <div className="text-sm font-medium text-foreground">Product</div>
                                        <div className="text-sm font-medium text-foreground">Stock in Hand</div>
                                        <div className="text-sm font-medium text-foreground">Price</div>
                                        <div className="text-sm font-medium text-foreground">Quantity</div>
                                        <div className="text-sm font-medium text-foreground">Total</div>
                                    </div>
                                    {form.watch('products')?.map((product, index) => (
                                        <div key={product?.product_id} className="grid grid-cols-5 gap-3 border-t pt-4">
                                            <div className="flex items-center">
                                                <FormField
                                                    control={form.control}
                                                    name={`products.${index}.product_id`}
                                                    render={({ field }) => (
                                                        <FormItem className="w-full">
                                                            <FormControl>
                                                                <ReactSelect
                                                                    options={productsOptions}
                                                                    placeholder=""
                                                                    value={productsOptions ? productsOptions?.find((option) => option?.value === field?.value) : null}
                                                                    isDisabled
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button className="px-2 ml-2" tabIndex="-1" type="button" onClick={() => formType === 'new' ? navigate(`/orders/${formType}?order_type=${orderType}&product_id=${product?.product_id}`) : navigate(`/orders/${formType}/${order_id}?order_type=${orderType}&product_id=${product?.product_id}`)}>
                                                    <Plus size={16} />
                                                </Button>
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.stock_in_hand`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                className="w-full"
                                                                {...field}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.price`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                className="w-full"
                                                                {...field}
                                                                disabled
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                className="w-full"
                                                                {...field}
                                                                onChange={e => {
                                                                    const quantity = handleNumberInputChange(e, field);
                                                                    form.setValue(`products.${index}.total`, quantity * form.watch(`products.${index}.price`))
                                                                    const sub_total = form.watch('products')?.reduce((acc, product) => acc + product.price * product.quantity, 0) || 0;
                                                                    form.setValue('sub_total', sub_total);
                                                                    form.setValue('total_due', sub_total - form.watch('discount') - form.watch('advance'));
                                                                    form.trigger(['sub_total', 'total_due', 'discount', 'advance']);
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.total`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            {<Input
                                                                className="w-full"
                                                                {...field}
                                                                disabled
                                                            />}
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    ))}

                                </div>
                            </div>
                            <div className=" grid grid-cols-5 gap-3 mt-5">
                                <div className="col-span-3">
                                    <FormField
                                        control={form.control}
                                        name="notes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Notes</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex items-center ">
                                    <Button variant="" className="bg-indigo-500 hover:bg-indigo-600" type="button" onClick={() => {
                                        // here we need to find the total quantity of all products and set it to total_firki
                                        const total_firki = form.watch('products')?.reduce((acc, product) => acc + parseInt(product.quantity), 0) || 0;
                                        form.setValue('total_firki', total_firki);
                                        form.trigger(['total_firki']);
                                    }}>Calculate</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-5 gap-3 mt-5">
                                <div className="col-span-3">

                                </div>
                                <div className="">
                                    <FormField
                                        control={form.control}
                                        name="total_firki"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Firki</FormLabel>
                                                <FormControl>
                                                    <Input className="" {...field} onChange={(e) => handleNumberInputChange(e, field)} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="">
                                    <FormField
                                        control={form.control}
                                        name="sub_total"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sub Total</FormLabel>
                                                <FormControl>
                                                    <Input className="" {...field} disabled />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-5 mt-5">
                                <div className="col-span-4"></div>
                                <div className="space-y-5">
                                    <FormField
                                        control={form.control}
                                        name="discount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Discount</FormLabel>
                                                <FormControl>
                                                    <Input className="" {...field} onChange={
                                                        e => {
                                                            const discount = handleDecimalInputChange(e, field);
                                                            form.setValue('total_due', form.watch('sub_total') - discount - form.watch('advance'));
                                                            form.trigger(['total_due', 'sub_total', 'advance', 'discount']);
                                                        }
                                                    } />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="advance"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Advance</FormLabel>
                                                <FormControl>
                                                    <Input className="" {...field} onChange={
                                                        e => {
                                                            const advance = handleDecimalInputChange(e, field);
                                                            form.setValue('total_due', form.watch('sub_total') - form.watch('discount') - advance);
                                                            form.trigger(['total_due', 'sub_total', 'advance', 'discount']);
                                                        }
                                                    } />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="total_due"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Total Due</FormLabel>
                                                <FormControl>
                                                    <Input className="" {...field} disabled />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {formType === "new" && <FormField
                                        control={form.control}
                                        name="is_delivered"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormLabel>Mark as Delivered</FormLabel>
                                                <FormControl>
                                                    <Checkbox {...field} checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />}
                                    {formType === "new" && whatsappServiceEnabled && <FormField
                                        control={form.control}
                                        name="send_order_on_whatsapp"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0">
                                                <FormLabel>Send Order on WhatsApp</FormLabel>
                                                <FormControl>
                                                    <Checkbox {...field} checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />}
                                </div>
                            </div>
                            <div className="w-full mt-5 flex items-center justify-center col-span-5 mb-20">
                                <MutationError mutation={createOrderMutation} />
                                <Button variant="" disabled={isEditLocked || createOrderMutation.isPending || updateOrderMutation.isPending} title={isEditLocked ? EDIT_LOCK_REASON : undefined} isLoading={createOrderMutation.isPending || updateOrderMutation.isPending} loadingText={formType === 'update' ? `updating ${form.watch("order_no")}...` : `creating ${form.watch("order_no")}...`} className="bg-indigo-500 hover:bg-indigo-600" type="submit">
                                    {formType === "update" ? "Update" : "Create"}{" "}
                                    {BILL_NUMBER_LABEL}. {form.watch("order_no")}
                                </Button>
                            </div>
                        </form>{" "}
                    </Form>
                </div>}
        </>
    );
};

export default BillsForm;
