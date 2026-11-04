-- Bill series: the name printed on a bill. The name is the whole row.
-- It can be inactive and made active again. It cannot be renamed or deleted.

-- migrate:up

CREATE TABLE IF NOT EXISTS bill_series (
    sr_no            SERIAL PRIMARY KEY,
    bill_series_id   UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name             VARCHAR(20)  NOT NULL,
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (name)
);

-- migrate:down

DROP TABLE IF EXISTS bill_series;
