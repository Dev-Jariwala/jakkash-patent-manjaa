-- Bill stock cutover: whether stock was deducted for this Bill.

-- migrate:up

ALTER TABLE gst_bills
    ADD COLUMN stock_applied BOOLEAN NOT NULL DEFAULT FALSE;

-- migrate:down

ALTER TABLE gst_bills
    DROP COLUMN IF EXISTS stock_applied;
