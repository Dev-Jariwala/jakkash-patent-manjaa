-- Bill numbers are unique within a collection, not across the shop.

-- migrate:up

ALTER TABLE gst_bills
    DROP CONSTRAINT gst_bills_bill_number_key;

ALTER TABLE gst_bills
    ADD CONSTRAINT gst_bills_collection_id_bill_number_key UNIQUE (collection_id, bill_number);

-- migrate:down

ALTER TABLE gst_bills
    DROP CONSTRAINT gst_bills_collection_id_bill_number_key;

ALTER TABLE gst_bills
    ADD CONSTRAINT gst_bills_bill_number_key UNIQUE (bill_number);
