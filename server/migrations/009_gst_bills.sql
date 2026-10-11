-- GST Bills (distinct from commercial Orders).

-- migrate:up

CREATE TABLE gst_bills (
    bill_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id            UUID NOT NULL REFERENCES collections (collection_id),
    bill_number              VARCHAR(62) NOT NULL UNIQUE,
    bill_date                DATE NOT NULL,
    receiver_mobile          VARCHAR(20) NOT NULL,
    receiver_name            VARCHAR(100) NOT NULL,
    receiver_address         VARCHAR(255) NOT NULL,
    receiver_gst_number      VARCHAR(15) NOT NULL,
    receiver_contact_person  VARCHAR(100),
    receiver_contact_number  VARCHAR(10),
    discount_percent         NUMERIC(5, 2) NOT NULL,
    total_value              NUMERIC(14, 2) NOT NULL,
    total_tax                NUMERIC(14, 2) NOT NULL,
    total_bill               NUMERIC(14, 2) NOT NULL,
    bank_name                VARCHAR(120) NOT NULL,
    bank_address             VARCHAR(255) NOT NULL,
    bank_account_number      VARCHAR(18) NOT NULL,
    bank_ifsc                VARCHAR(11) NOT NULL,
    saved_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gst_bills_collection_date ON gst_bills (collection_id, bill_date DESC, saved_at DESC);

CREATE TABLE gst_bill_lines (
    bill_line_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id              UUID NOT NULL REFERENCES gst_bills (bill_id) ON DELETE CASCADE,
    line_order           INT NOT NULL,
    product_id           UUID NOT NULL REFERENCES products (product_id),
    product_name         VARCHAR(255) NOT NULL,
    tax_code_id          UUID NOT NULL REFERENCES tax_codes (tax_code_id),
    tax_code             VARCHAR(20) NOT NULL,
    tax_code_description VARCHAR(255) NOT NULL,
    quantity             INT NOT NULL,
    rate                 NUMERIC(14, 2) NOT NULL,
    price                NUMERIC(14, 2) NOT NULL,
    cgst_percent         NUMERIC(5, 2) NOT NULL,
    sgst_percent         NUMERIC(5, 2) NOT NULL,
    igst_percent         NUMERIC(5, 2) NOT NULL,
    cgst_amount          NUMERIC(14, 2) NOT NULL,
    sgst_amount          NUMERIC(14, 2) NOT NULL,
    igst_amount          NUMERIC(14, 2) NOT NULL,
    discounted_price     NUMERIC(14, 2) NOT NULL,
    line_total           NUMERIC(14, 2) NOT NULL
);

CREATE INDEX idx_gst_bill_lines_bill_id ON gst_bill_lines (bill_id, line_order);

-- migrate:down

DROP TABLE IF EXISTS gst_bill_lines;
DROP TABLE IF EXISTS gst_bills;
