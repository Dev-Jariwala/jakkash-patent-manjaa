-- Product display order: one position per product within a collection.

-- migrate:up

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS display_position INT;

WITH legacy_order AS (
    SELECT *
    FROM unnest(ARRAY[
        'ONLY FIRKI 1000',
        'ONLY FIRKI 2500',
        'ONLY FIRKI 5000',
        '6/900 READY FIRKI',
        '6/250 READY FIRKI',
        '6/500 REDY FIRKI',
        '9/900 READY FIRKI',
        '9/250 READY FIRKI',
        '9/500 READY FIRKI',
        '12/900 READY FIRKI',
        '12/250 READY FIRKI',
        '12/500 READY FIRKI',
        '9/900 BOBIN',
        '9/250 BOBIN',
        '9/500 BOBIN',
        '12/900 BOBIN',
        '12/250 BOBIN',
        '12/500 BOBIN',
        'LABOUR 900 MTR RIL',
        'LABOUR 250 GM RIL',
        'LABOUR 500 GM RIL',
        'BOX'
    ]::text[]) WITH ORDINALITY AS t(product_name, list_ord)
),
ranked AS (
    SELECT
        p.product_id,
        p.collection_id,
        row_number() OVER (
            PARTITION BY p.collection_id
            ORDER BY
                CASE WHEN lo.list_ord IS NULL THEN 1 ELSE 0 END,
                lo.list_ord,
                p.product_name,
                p.sr_no
        )::int AS new_position
    FROM products p
    LEFT JOIN legacy_order lo ON lo.product_name = p.product_name
)
UPDATE products p
SET display_position = ranked.new_position
FROM ranked
WHERE p.product_id = ranked.product_id;

ALTER TABLE products
    ALTER COLUMN display_position SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_collection_display_position_idx
    ON products (collection_id, display_position);

-- migrate:down

DROP INDEX IF EXISTS products_collection_display_position_idx;

ALTER TABLE products
    DROP COLUMN IF EXISTS display_position;