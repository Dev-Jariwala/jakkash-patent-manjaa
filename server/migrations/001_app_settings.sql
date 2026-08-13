-- migrate:up
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value BOOLEAN NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_settings (setting_key, setting_value)
VALUES ('whatsapp_service_enabled', FALSE)
ON CONFLICT (setting_key) DO NOTHING;

-- migrate:down
DROP TABLE IF EXISTS app_settings;
