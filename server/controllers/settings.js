import { handleError } from "../utils/error.js";
import {
  getWhatsAppServiceEnabled,
  setWhatsAppServiceEnabled,
  WhatsAppServiceDisabledError,
} from "../services/whatsappServiceSetting.js";

export const getWhatsAppServiceSetting = async (req, res) => {
  try {
    const whatsapp_service_enabled = await getWhatsAppServiceEnabled();
    res.status(200).json({ whatsapp_service_enabled });
  } catch (error) {
    handleError("getWhatsAppServiceSetting", res, error);
  }
};

export const updateWhatsAppServiceSetting = async (req, res) => {
  try {
    const { whatsapp_service_enabled } = req.body;
    const setting = await setWhatsAppServiceEnabled(whatsapp_service_enabled);
    res.status(200).json({
      message: "WhatsApp service setting updated successfully",
      ...setting,
    });
  } catch (error) {
    handleError("updateWhatsAppServiceSetting", res, error);
  }
};

export { WhatsAppServiceDisabledError };
