import axios from "axios";
const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;
// router.post("/:collection_id/bills", billsValidators.validateCreateBill, billsControllers.createBill);
// router.get("/:collection_id/bills", billsControllers.getBills);
// router.get('/:collection_id/bills/:bill_id', billsControllers.getBillById);
export const getBillsByCollectionId = async ({ activeCollection, pagination, debouncedSearch, bill_type }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/bills?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${debouncedSearch}&bill_type=${bill_type}`,
        params: {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
        },
    });
    return response;
}

export const createBill = async ({ collection_id, data }) => {
    const response = await axios({
        method: "POST",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills`,
        data: data,
    });
    return response;
}

export const getBillById = async ({ collection_id, bill_id }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills/${bill_id}`,
    });
    return response;
}
// router.get('/:collection_id/bills/:bill_type/next-bill-no', billsControllers.getNextBillNo);

export const getNextBillNo = async ({ collection_id, bill_type }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills/next-bill-no?bill_type=${bill_type}`,
    });
    return response;
}

export const updateBillById = async ({ collection_id, bill_id, data }) => {
    const response = await axios({
        method: "PUT",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills/${bill_id}`,
        data: data,
    });
    return response;
}

export const updateBillDeliveryStatus = async ({ collection_id, bill_id, data }) => {
    const response = await axios({
        method: "PATCH",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills/${bill_id}/delivered`,
        data: data,
    });
    return response;
}

// router.get('/:collection_id/bills/:bill_type/report', billsControllers.getBillReport);

export const getBillReport = async ({ collection_id, bill_type, fromBillNo, toBillNo }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills/${bill_type}/report?fromBillNo=${fromBillNo}&toBillNo=${toBillNo}`,
    });
    return response;
}

// router.get('/:collection_id/:mobile/wholesale-bills', billsControllers.getAllBillsByMobile);

export const getWholeSaleBillsByMobile = async ({ collection_id, mobile }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills/wholesale-bills/pdf-report/${mobile}`,
    });
    return response;
}

// router.get('/:collection_id/bills/wholesale-bills/csv-report', billsControllers.getWholesaleBillsCsvReport);

export const getWholesaleBillsCsvReport = async ({ collection_id }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/bills/wholesale-bills/csv-report`,
    });
    return response;
}