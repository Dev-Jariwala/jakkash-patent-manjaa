-- GST not applicable mark: empty GST number with a boolean flag (not stored as N/A text).

-- migrate:up

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS gst_not_applicable BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE clients
    ADD CONSTRAINT clients_gst_not_both
    CHECK (NOT (gst_not_applicable AND gst_number IS NOT NULL));

-- migrate:down

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_gst_not_both;

ALTER TABLE clients DROP COLUMN IF EXISTS gst_not_applicable;