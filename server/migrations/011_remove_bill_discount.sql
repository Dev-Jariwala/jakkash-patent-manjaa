-- Bills have no discount; tax is on the full Price. Scratch bills are wiped.

-- migrate:up

DELETE FROM gst_bills;

ALTER TABLE gst_bills
    DROP COLUMN discount_percent;

ALTER TABLE gst_bill_lines
    DROP COLUMN discounted_price;

-- migrate:down

ALTER TABLE gst_bill_lines
    ADD COLUMN discounted_price NUMERIC(14, 2);

UPDATE gst_bill_lines
SET discounted_price = price
WHERE discounted_price IS NULL;

ALTER TABLE gst_bill_lines
    ALTER COLUMN discounted_price SET NOT NULL;

ALTER TABLE gst_bills
    ADD COLUMN discount_percent NUMERIC(5, 2);

UPDATE gst_bills
SET discount_percent = 0
WHERE discount_percent IS NULL;

ALTER TABLE gst_bills
    ALTER COLUMN discount_percent SET NOT NULL;
