-- Product names one tax code from Masters (id only on the row).

-- migrate:up

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS tax_code_id UUID REFERENCES tax_codes (tax_code_id);

CREATE INDEX IF NOT EXISTS products_tax_code_id_idx ON products (tax_code_id);

-- migrate:down

DROP INDEX IF EXISTS products_tax_code_id_idx;

ALTER TABLE products
    DROP COLUMN IF EXISTS tax_code_id;
