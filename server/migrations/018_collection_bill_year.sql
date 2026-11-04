-- A collection stores a bill year beside its name.
-- Existing collections start with none. The year is not taken from the name.

-- migrate:up

ALTER TABLE collections
    ADD COLUMN IF NOT EXISTS bill_year VARCHAR(20);

-- migrate:down

ALTER TABLE collections
    DROP COLUMN IF EXISTS bill_year;
