-- Client profile columns (pincode, state, city, GST, contacts).
-- Nullable so bill create can still insert name, mobile, and address only.

-- migrate:up

ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(6),
    ADD COLUMN IF NOT EXISTS state_id UUID REFERENCES states (state_id),
    ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities (city_id),
    ADD COLUMN IF NOT EXISTS gst_number VARCHAR(15),
    ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(10);

CREATE UNIQUE INDEX IF NOT EXISTS clients_gst_number_unique
    ON clients (gst_number)
    WHERE gst_number IS NOT NULL;

-- migrate:down

DROP INDEX IF EXISTS clients_gst_number_unique;

ALTER TABLE clients
    DROP COLUMN IF EXISTS contact_number,
    DROP COLUMN IF EXISTS contact_person,
    DROP COLUMN IF EXISTS gst_number,
    DROP COLUMN IF EXISTS city_id,
    DROP COLUMN IF EXISTS state_id,
    DROP COLUMN IF EXISTS pincode;
