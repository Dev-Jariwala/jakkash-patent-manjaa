-- =====================================================================
--  Baseline schema from the AWS Postgres dump (jakkash-aws-backup.dump)
-- =====================================================================
--  Schema only. No row data from the dump is loaded.
--  Matches the dump: 8 tables, their keys, checks, and foreign keys.
--  Does not add app_settings, bills.whatsapp_metadata, or extra indexes.
--  Migrations 001–003 add WhatsApp support.
--
--  dbmate wraps this file in a transaction. Do not add BEGIN/COMMIT.
--  Apply from server/:
--    npm run db:up
-- =====================================================================

-- migrate:up

-- gen_random_uuid() is built into PostgreSQL 13+. pgcrypto covers older
-- servers and is a no-op if already present. The dump was taken on 17.6.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- users ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    sr_no    SERIAL PRIMARY KEY,
    user_id  UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    username VARCHAR(50)  NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- collections ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
    sr_no           SERIAL PRIMARY KEY,
    collection_id   UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_name VARCHAR(50) NOT NULL
);

-- clients -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
    sr_no     SERIAL PRIMARY KEY,
    client_id UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name      VARCHAR(100) NOT NULL,
    mobile    VARCHAR(20)  NOT NULL UNIQUE,
    address   VARCHAR(255) NOT NULL
);

-- products ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    sr_no           SERIAL PRIMARY KEY,
    product_id      UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_id   UUID           NOT NULL REFERENCES collections (collection_id),
    product_name    VARCHAR(50)    NOT NULL,
    wholesale_price NUMERIC(12, 2),
    retail_price    NUMERIC(12, 2),
    stock_in_hand   INTEGER        NOT NULL,
    total_stock     INTEGER        NOT NULL,
    is_labour       BOOLEAN        DEFAULT FALSE,
    is_delete       BOOLEAN        DEFAULT FALSE,
    created_at      TIMESTAMPTZ    DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ
);

-- purchases -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    sr_no            SERIAL PRIMARY KEY,
    purchase_id      UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_id    UUID           NOT NULL REFERENCES collections (collection_id),
    purchase_date    TIMESTAMPTZ    NOT NULL,
    invoice_no       VARCHAR(255),
    supplier_name    VARCHAR(255),
    item_description TEXT,
    rate             NUMERIC(12, 2) NOT NULL,
    quantity         INTEGER        NOT NULL
);

-- stocks --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stocks (
    sr_no         SERIAL PRIMARY KEY,
    stock_id      UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    product_id    UUID        NOT NULL REFERENCES products (product_id),
    collection_id UUID        NOT NULL REFERENCES collections (collection_id),
    quantity      INTEGER     NOT NULL,
    date          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ
);

-- bills ---------------------------------------------------------------
-- bill_type is nullable, matching the dump. The check allows only
-- 'retail' or 'wholesale' when a value is present.
CREATE TABLE IF NOT EXISTS bills (
    sr_no          SERIAL PRIMARY KEY,
    bill_id        UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_id  UUID           NOT NULL REFERENCES collections (collection_id),
    bill_no        INTEGER        NOT NULL,
    bill_type      VARCHAR(50),
    mobile         VARCHAR(20)    NOT NULL,
    name           VARCHAR(100)   NOT NULL,
    address        VARCHAR(500)   NOT NULL,
    order_date     TIMESTAMPTZ    NOT NULL,
    delivery_date  TIMESTAMPTZ    NOT NULL,
    notes          TEXT,
    total_firki    INTEGER        NOT NULL,
    sub_total      NUMERIC(12, 2) NOT NULL,
    discount       NUMERIC(12, 2) NOT NULL,
    advance        NUMERIC(12, 2) NOT NULL,
    total_due      NUMERIC(12, 2) NOT NULL,
    delivered_at   TIMESTAMPTZ,
    CONSTRAINT bills_bill_type_check CHECK (
        (bill_type)::text = ANY (
            ARRAY[
                ('retail'::character varying)::text,
                ('wholesale'::character varying)::text
            ]
        )
    ),
    CONSTRAINT bills_collection_id_bill_no_bill_type_key
        UNIQUE (collection_id, bill_no, bill_type)
);

-- bill_items ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS bill_items (
    sr_no        SERIAL PRIMARY KEY,
    bill_item_id UUID           NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    bill_id      UUID           NOT NULL REFERENCES bills (bill_id),
    product_id   UUID           NOT NULL REFERENCES products (product_id),
    quantity     INTEGER        NOT NULL,
    price        NUMERIC(12, 2) NOT NULL,
    CONSTRAINT bill_items_bill_id_product_id_key UNIQUE (bill_id, product_id)
);

-- Seed one login. Passwords are stored as plain text.
-- Skipped when username admin already exists.
INSERT INTO users (username, password)
VALUES ('admin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- migrate:down

DROP TABLE IF EXISTS bill_items;
DROP TABLE IF EXISTS bills;
DROP TABLE IF EXISTS stocks;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS collections;
DROP TABLE IF EXISTS users;
