import axios from "axios";

const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function listGstBills(collectionId) {
  const response = await axios({
    method: "GET",
    url: `${BACKEND_URL}collections/${collectionId}/gst-bills`,
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

export async function previewGstBillTotals(collectionId, data) {
  const response = await axios({
    method: "POST",
    url: `${BACKEND_URL}collections/${collectionId}/gst-bills/preview-totals`,
    data,
  });
  return response;
}
