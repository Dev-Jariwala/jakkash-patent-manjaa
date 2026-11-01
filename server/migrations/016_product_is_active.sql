-- A product is active unless the operator marks it inactive.
-- Existing rows stay active so today's catalogue does not disappear.

-- migrate:up

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- migrate:down

ALTER TABLE products
    DROP COLUMN IF EXISTS is_active;
