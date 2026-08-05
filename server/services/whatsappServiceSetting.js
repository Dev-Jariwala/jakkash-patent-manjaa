import { query } from "../utils/query.js";

export const WHATSAPP_SERVICE_SETTING_KEY = "whatsapp_service_enabled";

export class WhatsAppServiceDisabledError extends Error {
  constructor(message = "WhatsApp bill delivery is disabled") {
    super(message);
    this.name = "WhatsAppServiceDisabledError";
    this.code = "WHATSAPP_SERVICE_DISABLED";
    this.statusCode = 403;
  }
}

export async function getWhatsAppServiceEnabled() {
  const [row] = await query(
    "SELECT setting_value FROM app_settings WHERE setting_key = $1",
    [WHATSAPP_SERVICE_SETTING_KEY]
  );

  return row?.setting_value ?? false;
}

export async function setWhatsAppServiceEnabled(enabled) {
  const [row] = await query(
    `INSERT INTO app_settings (setting_key, setting_value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (setting_key)
     DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
     RETURNING setting_value, updated_at`,
    [WHATSAPP_SERVICE_SETTING_KEY, enabled]
  );

  return {
    whatsapp_service_enabled: row.setting_value,
    updated_at: row.updated_at,
  };
}

/**
 * Single enforcement point for "is WhatsApp delivery allowed right now?".
 * Both the create flow and the resend flow go through this so the backend
 * stays the source of truth even when the frontend holds a stale toggle.
 * Throws `WhatsAppServiceDisabledError` (403), which `handleError` propagates.
 */
export async function assertWhatsAppServiceEnabled() {
  const enabled = await getWhatsAppServiceEnabled();
  if (!enabled) {
    throw new WhatsAppServiceDisabledError();
  }
  return enabled;
}
