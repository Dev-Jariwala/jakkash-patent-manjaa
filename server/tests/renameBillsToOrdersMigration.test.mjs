import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import pg from "pg";

const migrationPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../migrations/006_rename_bills_to_orders.sql"
);

function splitMigration(sql) {
  const upMarker = "-- migrate:up";
  const downMarker = "-- migrate:down";
  const upStart = sql.indexOf(upMarker) + upMarker.length;
  const downStart = sql.indexOf(downMarker);
  return {
    up: sql.slice(upStart, downStart).trim(),
    down: sql.slice(downMarker + downMarker.length).trim(),
  };
}

async function withMigrationDatabase(run) {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { skipped: true };
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  const schema = `migrate_test_${Date.now()}`;
  try {
    await client.query(`CREATE SCHEMA ${schema}`);
    await client.query(`SET search_path TO ${schema}, public`);

    await client.query(`
      CREATE TABLE collections (
        collection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_name VARCHAR(50) NOT NULL
      );
      INSERT INTO collections (collection_id, collection_name)
      VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test');

      CREATE TABLE products (
        product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        collection_id UUID NOT NULL REFERENCES collections(collection_id),
        product_name VARCHAR(50) NOT NULL,
        retail_price FLOAT,
        wholesale_price FLOAT,
        stock_in_hand INT NOT NULL,
        total_stock INT NOT NULL
      );
      INSERT INTO products (product_id, collection_id, product_name, retail_price, wholesale_price, stock_in_hand, total_stock)
      VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Manja', 100, 80, 50, 50);

      CREATE TABLE bills (
        sr_no SERIAL PRIMARY KEY,
        bill_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        collection_id UUID NOT NULL REFERENCES collections(collection_id),
        bill_no INT NOT NULL,
        bill_type VARCHAR(50) CHECK (bill_type IN ('retail', 'wholesale')),
        mobile VARCHAR(20) NOT NULL,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(500) NOT NULL,
        order_date TIMESTAMPTZ NOT NULL,
        delivery_date TIMESTAMPTZ NOT NULL,
        notes TEXT,
        total_firki INT NOT NULL,
        sub_total FLOAT NOT NULL,
        discount FLOAT NOT NULL,
        advance FLOAT NOT NULL,
        total_due FLOAT NOT NULL,
        delivered_at TIMESTAMPTZ,
        whatsapp_metadata JSONB NOT NULL DEFAULT '{"status":"no","delivery_requested":false}'::jsonb,
        UNIQUE (collection_id, bill_no, bill_type)
      );

      CREATE TABLE bill_items (
        sr_no SERIAL PRIMARY KEY,
        bill_item_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
        bill_id UUID NOT NULL REFERENCES bills(bill_id),
        product_id UUID NOT NULL REFERENCES products(product_id),
        quantity INT NOT NULL,
        price FLOAT NOT NULL,
        UNIQUE (bill_id, product_id)
      );
    `);

    const orderId = "cccccccc-cccc-cccc-cccc-cccccccccccc";
    const itemId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    await client.query(
      `INSERT INTO bills (
        bill_id, collection_id, bill_no, bill_type, mobile, name, address,
        order_date, delivery_date, notes, total_firki, sub_total, discount, advance, total_due, whatsapp_metadata
      ) VALUES ($1, $2, 42, 'retail', '9876543210', 'Client', 'Addr',
        '2026-01-01', '2026-01-02', 'note', 1, 100, 0, 20, 80, '{"status":"success"}'::jsonb)`,
      [orderId, "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]
    );
    await client.query(
      `INSERT INTO bill_items (bill_item_id, bill_id, product_id, quantity, price)
       VALUES ($1, $2, $3, 2, 50)`,
      [itemId, orderId, "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]
    );

    const { up, down } = splitMigration(readFileSync(migrationPath, "utf8"));
    await client.query(up);

    const [afterUp] = (
      await client.query(
        `SELECT o.order_id, o.order_no, o.order_type, o.total_due, o.whatsapp_metadata,
                oi.order_item_id, oi.quantity, oi.price
         FROM orders o
         JOIN order_items oi ON o.order_id = oi.order_id
         WHERE o.order_id = $1`,
        [orderId]
      )
    ).rows;

    assert.equal(afterUp.order_id, orderId);
    assert.equal(afterUp.order_no, 42);
    assert.equal(afterUp.order_type, "retail");
    assert.equal(Number(afterUp.total_due), 80);
    assert.equal(afterUp.order_item_id, itemId);
    assert.equal(afterUp.quantity, 2);

    await client.query(down);

    const [afterDown] = (
      await client.query(
        `SELECT b.bill_id, b.bill_no, bi.bill_item_id, bi.quantity
         FROM bills b
         JOIN bill_items bi ON b.bill_id = bi.bill_id
         WHERE b.bill_id = $1`,
        [orderId]
      )
    ).rows;

    assert.equal(afterDown.bill_id, orderId);
    assert.equal(afterDown.bill_no, 42);
    assert.equal(afterDown.bill_item_id, itemId);
    assert.equal(afterDown.quantity, 2);

    await run({ skipped: false });
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await client.end();
  }
  return { skipped: false };
}

describe("006_rename_bills_to_orders migration", () => {
  it("keeps one sale row and line item through up and down", async () => {
    const result = await withMigrationDatabase(async () => {});
    if (result.skipped) {
      console.log("Skipping migration test: set TEST_DATABASE_URL or DATABASE_URL");
    }
  });
});
