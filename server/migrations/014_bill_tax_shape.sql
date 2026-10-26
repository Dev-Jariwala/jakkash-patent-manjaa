-- Bill tax shape and copied tax-rate trio on lines.

-- migrate:up

ALTER TABLE gst_bills
    ADD COLUMN tax_shape VARCHAR(20) CHECK (tax_shape IN ('within-state', 'interstate'));

ALTER TABLE gst_bill_lines
    ADD COLUMN tax_rates_are_copy BOOLEAN NOT NULL DEFAULT FALSE;

-- migrate:down

ALTER TABLE gst_bill_lines
    DROP COLUMN IF EXISTS tax_rates_are_copy;

ALTER TABLE gst_bills
    DROP COLUMN IF EXISTS tax_shape;
