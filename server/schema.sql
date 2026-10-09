-- =====================================================================
--  JAKKASH PATENT MANJAA — COMPLETE DATABASE SCHEMA (PostgreSQL)
-- =====================================================================
--  This is the single source of truth. It replaces:
--    - server/jakkash table.sql              (STALE: MySQL-era DDL, do not use)
--    - server/migrations/001_app_settings.sql
--    - server/migrations/002_bills_whatsapp_metadata.sql
--
--  Safe to run on a FRESH database and on an EXISTING one — everything
--  is idempotent (CREATE ... IF NOT EXISTS / ADD COLUMN IF NOT EXISTS /
--  ON CONFLICT DO NOTHING) and wrapped in a single transaction.
--
--  Run with:
--    psql "$DATABASE_URL" -f server/schema.sql
--  or paste the whole file into your SQL console in one shot.
-- =====================================================================


-- ---------------------------------------------------------------------
-- SECTION 0 — OPTIONAL HARD RESET
-- ---------------------------------------------------------------------
-- Uncomment ONLY if you want to wipe and rebuild from scratch.
-- This destroys all data. Order matters (children first).
--
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS bills       CASCADE;
-- DROP TABLE IF EXISTS stocks      CASCADE;
-- DROP TABLE IF EXISTS purchases   CASCADE;
-- DROP TABLE IF EXISTS products    CASCADE;
-- DROP TABLE IF EXISTS clients     CASCADE;
-- DROP TABLE IF EXISTS collections CASCADE;
-- DROP TABLE IF EXISTS users       CASCADE;
-- DROP TABLE IF EXISTS app_settings CASCADE;


BEGIN;

-- ---------------------------------------------------------------------
-- SECTION 1 — EXTENSIONS
-- ---------------------------------------------------------------------
-- gen_random_uuid() is built into PostgreSQL 13+. pgcrypto covers older
-- servers and is a no-op if already present.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ---------------------------------------------------------------------
-- SECTION 2 — CORE TABLES
-- ---------------------------------------------------------------------
-- Convention used throughout this project:
--   sr_no    -> SERIAL surrogate PK, used for stable display ordering
--   <x>_id   -> UUID business key, this is what the API and FKs use

-- users ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    sr_no       SERIAL PRIMARY KEY,
    user_id     UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL
);

-- collections ---------------------------------------------------------
-- One collection = one season/year (e.g. "2024-25"). Everything else is
-- scoped by collection_id.
CREATE TABLE IF NOT EXISTS collections (
    sr_no           SERIAL PRIMARY KEY,
    collection_id   UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_name VARCHAR(50) NOT NULL
);
-- Uniqueness of collection_name is enforced in validators/collections.js.
-- Enable the DB-level guarantee too if your existing data has no duplicates:
-- ALTER TABLE collections ADD CONSTRAINT collections_collection_name_key
--     UNIQUE (collection_name);

-- clients -------------------------------------------------------------
-- Identified by mobile number; upserted on every bill create.
CREATE TABLE IF NOT EXISTS clients (
    sr_no            SERIAL PRIMARY KEY,
    client_id        UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name             VARCHAR(100) NOT NULL,
    mobile           VARCHAR(20)  NOT NULL UNIQUE,
    address          VARCHAR(255) NOT NULL,
    pincode          VARCHAR(6),
    state_id         UUID REFERENCES states (state_id),
    city_id          UUID REFERENCES cities (city_id),
    gst_number       VARCHAR(15),
    contact_person   VARCHAR(100),
    contact_number   VARCHAR(10)
);

-- products ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    sr_no           SERIAL PRIMARY KEY,
    product_id      UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_id   UUID        NOT NULL REFERENCES collections (collection_id),
    product_name    VARCHAR(50) NOT NULL,
    wholesale_price FLOAT,
    retail_price    FLOAT,
    stock_in_hand   INT         NOT NULL DEFAULT 0,
    total_stock     INT         NOT NULL DEFAULT 0,
    is_labour       BOOLEAN     DEFAULT FALSE,
    is_delete       BOOLEAN     DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ
);

-- stocks --------------------------------------------------------------
-- Stock-in entries. Each row bumps products.stock_in_hand + total_stock.
CREATE TABLE IF NOT EXISTS stocks (
    sr_no         SERIAL PRIMARY KEY,
    stock_id      UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    product_id    UUID        NOT NULL REFERENCES products (product_id),
    collection_id UUID        NOT NULL REFERENCES collections (collection_id),
    quantity      INT         NOT NULL,
    date          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ
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
    rate             DECIMAL(12, 2) NOT NULL,
    quantity         INT            NOT NULL
);

 -- orders ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    sr_no             SERIAL PRIMARY KEY,
    order_id           UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_id     UUID        NOT NULL REFERENCES collections (collection_id),
    order_no           INT         NOT NULL,
    order_type         VARCHAR(50) NOT NULL
                                  CHECK (order_type IN ('retail', 'wholesale')),
    mobile            VARCHAR(20)  NOT NULL,
    name              VARCHAR(100) NOT NULL,
    address           VARCHAR(500) NOT NULL,
    order_date        TIMESTAMPTZ  NOT NULL,
    delivery_date     TIMESTAMPTZ  NOT NULL,
    notes             TEXT,
    total_firki       INT   NOT NULL,
    sub_total         FLOAT NOT NULL,
    discount          FLOAT NOT NULL,
    advance           FLOAT NOT NULL,
    total_due         FLOAT NOT NULL,

    -- NULL = not delivered. Set to now() when marked delivered.
    delivered_at      TIMESTAMPTZ DEFAULT NULL,

    -- Latest WhatsApp bill delivery state (ADR-0004: latest state only,
    -- no attempt history). Keys must match
    -- services/whatsappBillMetadata.js -> createInitialWhatsAppMetadata().
    -- status: 'no' | 'processing' | 'success' | 'failed' | 'canceled'
    whatsapp_metadata JSONB NOT NULL DEFAULT '{
      "status": "no",
      "delivery_requested": false,
      "delivery_requested_at": null,
      "processing_started_at": null,
      "completed_at": null,
      "error_message": null,
      "provider_message_id": null,
      "provider_accepted_at": null,
      "queue_job_id": null,
      "cancel_requested": false,
      "canceled_at": null
    }'::jsonb,

    CONSTRAINT orders_collection_id_order_no_order_type_key
        UNIQUE (collection_id, order_no, order_type)
);

-- order_items ----------------------------------------------------------
-- price is snapshotted at bill time (retail_price or wholesale_price
-- depending on bills.order_type), so later product price edits do not
-- rewrite historical bills.
CREATE TABLE IF NOT EXISTS order_items (
    sr_no        SERIAL PRIMARY KEY,
    order_item_id UUID  NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    order_id      UUID  NOT NULL REFERENCES orders (order_id),
    product_id   UUID  NOT NULL REFERENCES products (product_id),
    quantity     INT   NOT NULL,
    price        FLOAT NOT NULL,
    CONSTRAINT order_items_order_id_product_id_key UNIQUE (order_id, product_id)
);
-- Note: no ON DELETE CASCADE by design — controllers/orders.js deletes
-- order_items explicitly so it can restore products.stock_in_hand.

-- app_settings --------------------------------------------------------
-- Global key/value shop settings (ADR-0009, ADR-0010). Currently holds
-- the WhatsApp service toggle.
CREATE TABLE IF NOT EXISTS app_settings (
    setting_key   VARCHAR(100) PRIMARY KEY,
    setting_value BOOLEAN      NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------
-- SECTION 3 — UPGRADE PATH FOR EXISTING DATABASES
-- ---------------------------------------------------------------------
-- No-ops on a fresh install. These bring an older database forward
-- without touching data.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_labour  BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_delete  BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE stocks
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS whatsapp_metadata JSONB NOT NULL DEFAULT '{
      "status": "no",
      "delivery_requested": false,
      "delivery_requested_at": null,
      "processing_started_at": null,
      "completed_at": null,
      "error_message": null,
      "provider_message_id": null,
      "provider_accepted_at": null,
      "queue_job_id": null,
      "cancel_requested": false,
      "canceled_at": null
    }'::jsonb;

-- Backfill: migration 002 shipped without provider_accepted_at, but the
-- metadata builders in services/whatsappBillMetadata.js always write it.
-- This aligns pre-existing rows with the canonical shape.
UPDATE orders
SET whatsapp_metadata = whatsapp_metadata || '{"provider_accepted_at": null}'::jsonb
WHERE NOT (whatsapp_metadata ? 'provider_accepted_at');


-- ---------------------------------------------------------------------
-- SECTION 4 — INDEXES
-- ---------------------------------------------------------------------
-- Every index below backs a query that actually exists in the codebase.
-- UNIQUE columns (users.username, clients.mobile, *_id, and the bills
-- (collection_id, order_no, order_type) constraint) are already indexed.

-- products: collection listing + ILIKE search + report joins
CREATE INDEX IF NOT EXISTS idx_products_collection_id
    ON products (collection_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_created_at
    ON products (collection_id, created_at DESC);

-- stocks: collection listing, product join, default sort is date DESC
CREATE INDEX IF NOT EXISTS idx_stocks_collection_id
    ON stocks (collection_id);
CREATE INDEX IF NOT EXISTS idx_stocks_product_id
    ON stocks (product_id);
CREATE INDEX IF NOT EXISTS idx_stocks_collection_date
    ON stocks (collection_id, date DESC);

-- purchases: collection listing + analytics SUM(rate * quantity)
CREATE INDEX IF NOT EXISTS idx_purchases_collection_id
    ON purchases (collection_id);

-- bills: the paginated list filters on (collection_id, order_type) and
-- sorts by order_no; wholesale-by-mobile report filters on mobile.
CREATE INDEX IF NOT EXISTS idx_orders_collection_type_orderno
    ON orders (collection_id, order_type, order_no DESC);
CREATE INDEX IF NOT EXISTS idx_orders_mobile
    ON orders (mobile);

-- order_items: joined by order_id on every bill fetch, by product_id in
-- the products report and analytics subqueries.
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
    ON order_items (product_id);


-- ---------------------------------------------------------------------
-- SECTION 5 — SEED DATA
-- ---------------------------------------------------------------------
-- WhatsApp bill delivery ships disabled (ADR-0007: operator-controlled
-- toggle, default off).
INSERT INTO app_settings (setting_key, setting_value)
VALUES ('whatsapp_service_enabled', FALSE)
ON CONFLICT (setting_key) DO NOTHING;


COMMIT;


-- =====================================================================
--  POST-INSTALL
-- =====================================================================
--  Create your first login user (passwords are stored as-is by
--  controllers/users.js — no hashing yet):
--
--    INSERT INTO users (username, password) VALUES ('admin', 'change-me');
--
--  Create your first collection:
--
--    INSERT INTO collections (collection_name) VALUES ('2024-25');
--
--  Turn WhatsApp bill delivery on (or use the settings screen):
--
--    UPDATE app_settings
--    SET setting_value = TRUE, updated_at = NOW()
--    WHERE setting_key = 'whatsapp_service_enabled';
-- =====================================================================
