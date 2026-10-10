-- Single shop bank account for future Bill PDF bank block.

-- migrate:up

CREATE TABLE IF NOT EXISTS shop_bank_account (
    shop_bank_account_id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (shop_bank_account_id = 1),
    bank_name        VARCHAR(120)  NOT NULL,
    bank_address     VARCHAR(255)  NOT NULL,
    account_number   VARCHAR(18)   NOT NULL,
    ifsc             VARCHAR(11)   NOT NULL,
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- migrate:down

DROP TABLE IF EXISTS shop_bank_account;
