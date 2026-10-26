import axios from "axios";

const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function listGstBills(collectionId, { page, limit, search } = {}) {
  const response = await axios({
    method: "GET",
    url: `${BACKEND_URL}collections/${collectionId}/gst-bills`,
    params: {
      page,
      limit,
      search: search ?? "",
    },
  });
  return response;
}

export async function createGstBill(collectionId, data) {
  const response = await axios({
    method: "POST",
    url: `${BACKEND_URL}collections/${collectionId}/gst-bills`,
    data,
  });
  return response;
}

export async function getGstBill(collectionId, billId) {
  const response = await axios({
    method: "GET",
    url: `${BACKEND_URL}collections/${collectionId}/gst-bills/${billId}`,
  });
  return response;
}

export async function updateGstBill(collectionId, billId, data) {
  const response = await axios({
    method: "PUT",
    url: `${BACKEND_URL}collections/${collectionId}/gst-bills/${billId}`,
    data,
  });
  return response;
}

export async function previewGstBillTotals(collectionId, data) {
  const response = await axios({
    method: "POST",
    url: `${BACKEND_URL}collections/${collectionId}/gst-bills/preview-totals`,
    data,
  });
  return response;
}
