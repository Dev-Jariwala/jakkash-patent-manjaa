import { body, validationResult } from "express-validator";

export const validateUpdateWhatsAppServiceSetting = [
  body("whatsapp_service_enabled")
    .isBoolean()
    .withMessage("whatsapp_service_enabled must be a boolean"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
