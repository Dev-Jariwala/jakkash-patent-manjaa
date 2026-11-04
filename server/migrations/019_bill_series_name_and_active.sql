-- Databases that already applied the first draft of bill series
-- still have token and is_on. The printed series is a name, and a series is active or inactive.

-- migrate:up

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bill_series' AND column_name = 'token'
    ) THEN
        ALTER TABLE bill_series RENAME COLUMN token TO name;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bill_series' AND column_name = 'is_on'
    ) THEN
        ALTER TABLE bill_series RENAME COLUMN is_on TO is_active;
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bill_series_token_key'
    ) THEN
        ALTER TABLE bill_series RENAME CONSTRAINT bill_series_token_key TO bill_series_name_key;
    END IF;
END $$;

-- migrate:down

-- name and is_active are the bill series columns. Leave them in place.
SELECT 1;
