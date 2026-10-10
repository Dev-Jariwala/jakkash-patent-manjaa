-- HSN/SAC tax code catalog for future GST Bills.

-- migrate:up

CREATE TABLE IF NOT EXISTS tax_codes (
    sr_no         SERIAL PRIMARY KEY,
    tax_code_id   UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    type          VARCHAR(3)     NOT NULL CHECK (type IN ('HSN', 'SAC')),
    code          VARCHAR(8)     NOT NULL,
    description   VARCHAR(255)   NOT NULL,
    cgst          NUMERIC(5, 2)  NOT NULL,
    sgst          NUMERIC(5, 2)  NOT NULL,
    igst          NUMERIC(5, 2)  NOT NULL,
    UNIQUE (type, code)
);

CREATE INDEX IF NOT EXISTS tax_codes_type_code_idx ON tax_codes (type, code);

-- migrate:down

DROP TABLE IF EXISTS tax_codes;
