import axios from "axios";

const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function getShopBankAccount() {
  const response = await axios({
    method: "GET",
    url: `${BACKEND_URL}common/shop-bank-account`,
  });
  return response;
}

export async function saveShopBankAccount(data) {
  const response = await axios({
    method: "PUT",
    url: `${BACKEND_URL}common/shop-bank-account`,
    data,
  });
  return response;
}
