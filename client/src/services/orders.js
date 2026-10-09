import axios from "axios";
const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;

export const getOrdersByCollectionId = async ({ activeCollection, pagination, debouncedSearch, order_type }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/orders?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${debouncedSearch}&order_type=${order_type}`,
        params: {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
        },
    });
    return response;
}

export const createOrder = async ({ collection_id, data }) => {
    const response = await axios({
        method: "POST",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders`,
        data: data,
    });
    return response;
}

export const getOrderById = async ({ collection_id, order_id }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/${order_id}`,
    });
    return response;
}

export const getNextOrderNo = async ({ collection_id, order_type }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/next-order-no?order_type=${order_type}`,
    });
    return response;
}

export const updateOrderById = async ({ collection_id, order_id, data }) => {
    const response = await axios({
        method: "PUT",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/${order_id}`,
        data: data,
    });
    return response;
}

export const updateOrderDeliveryStatus = async ({ collection_id, order_id, data }) => {
    const response = await axios({
        method: "PATCH",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/${order_id}/delivered`,
        data: data,
    });
    return response;
}

export const updateOrderPaymentStatus = async ({ collection_id, order_id, data }) => {
    const response = await axios({
        method: "PATCH",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/${order_id}/payment`,
        data: data,
    });
    return response;
}

export const resendOrderWhatsAppDelivery = async ({ collection_id, order_id }) => {
    const response = await axios({
        method: "POST",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/${order_id}/whatsapp/resend`,
    });
    return response;
}

export const forceCancelOrderWhatsAppDelivery = async ({ collection_id, order_id }) => {
    const response = await axios({
        method: "POST",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/${order_id}/whatsapp/cancel`,
    });
    return response;
}

export const getOrderReport = async ({ collection_id, order_type, fromBillNo, toBillNo }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/${order_type}/report?fromBillNo=${fromBillNo}&toBillNo=${toBillNo}`,
    });
    return response;
}

export const getWholeSaleOrdersByMobile = async ({ collection_id, mobile }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/wholesale-orders/pdf-report/${mobile}`,
    });
    return response;
}

export const getWholesaleOrdersCsvReport = async ({ collection_id }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/orders/wholesale-orders/csv-report`,
    });
    return response;
}
