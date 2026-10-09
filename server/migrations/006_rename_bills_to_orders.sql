-- migrate:up

ALTER TABLE bills RENAME TO orders;

ALTER TABLE orders RENAME COLUMN bill_id TO order_id;
ALTER TABLE orders RENAME COLUMN bill_no TO order_no;
ALTER TABLE orders RENAME COLUMN bill_type TO order_type;

ALTER TABLE orders RENAME CONSTRAINT bills_bill_type_check TO orders_order_type_check;
ALTER TABLE orders RENAME CONSTRAINT bills_collection_id_bill_no_bill_type_key TO orders_collection_id_order_no_order_type_key;

ALTER INDEX IF EXISTS idx_bills_collection_type_billno RENAME TO idx_orders_collection_type_orderno;
ALTER INDEX IF EXISTS idx_bills_mobile RENAME TO idx_orders_mobile;

ALTER TABLE bill_items RENAME TO order_items;

ALTER TABLE order_items RENAME COLUMN bill_item_id TO order_item_id;
ALTER TABLE order_items RENAME COLUMN bill_id TO order_id;

ALTER TABLE order_items RENAME CONSTRAINT bill_items_bill_id_product_id_key TO order_items_order_id_product_id_key;

ALTER INDEX IF EXISTS idx_bill_items_bill_id RENAME TO idx_order_items_order_id;
ALTER INDEX IF EXISTS idx_bill_items_product_id RENAME TO idx_order_items_product_id;

-- migrate:down

ALTER INDEX IF EXISTS idx_order_items_product_id RENAME TO idx_bill_items_product_id;
ALTER INDEX IF EXISTS idx_order_items_order_id RENAME TO idx_bill_items_bill_id;

ALTER TABLE order_items RENAME CONSTRAINT order_items_order_id_product_id_key TO bill_items_bill_id_product_id_key;

ALTER TABLE order_items RENAME COLUMN order_id TO bill_id;
ALTER TABLE order_items RENAME COLUMN order_item_id TO bill_item_id;

ALTER TABLE order_items RENAME TO bill_items;

ALTER INDEX IF EXISTS idx_orders_mobile RENAME TO idx_bills_mobile;
ALTER INDEX IF EXISTS idx_orders_collection_type_orderno RENAME TO idx_bills_collection_type_billno;

ALTER TABLE orders RENAME CONSTRAINT orders_collection_id_order_no_order_type_key TO bills_collection_id_bill_no_bill_type_key;
ALTER TABLE orders RENAME CONSTRAINT orders_order_type_check TO bills_bill_type_check;

ALTER TABLE orders RENAME COLUMN order_type TO bill_type;
ALTER TABLE orders RENAME COLUMN order_no TO bill_no;
ALTER TABLE orders RENAME COLUMN order_id TO bill_id;

ALTER TABLE orders RENAME TO bills;
