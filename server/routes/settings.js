import express from "express";
import * as settingsControllers from "../controllers/settings.js";
import * as settingsValidators from "../validators/settings.js";

const router = express.Router();

router.get(
  "/whatsapp-service",
  settingsControllers.getWhatsAppServiceSetting
);
router.put(
  "/whatsapp-service",
  settingsValidators.validateUpdateWhatsAppServiceSetting,
  settingsControllers.updateWhatsAppServiceSetting
);

export default router;
