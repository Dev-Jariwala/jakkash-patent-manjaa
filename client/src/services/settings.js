import axios from "axios";

const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export async function getWhatsAppServiceSetting() {
  const response = await axios({
    method: "GET",
    url: `${BACKEND_URL}settings/whatsapp-service`,
  });
  return response;
}

export async function updateWhatsAppServiceSetting(whatsapp_service_enabled) {
  const response = await axios({
    method: "PUT",
    url: `${BACKEND_URL}settings/whatsapp-service`,
    data: { whatsapp_service_enabled },
  });
  return response;
}
