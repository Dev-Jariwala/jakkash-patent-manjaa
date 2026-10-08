-- Common location tables shared across projects.
-- country_id, state_id, and city_id are the UUIDs other tables will store.
-- Seed UUIDs are fixed so every database that applies this migration
-- gets the same India, Gujarat, and Surat ids.

-- migrate:up

CREATE TABLE IF NOT EXISTS countries (
    sr_no      SERIAL PRIMARY KEY,
    country_id UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    iso2       CHAR(2)      NOT NULL UNIQUE,
    iso3       CHAR(3)      NOT NULL UNIQUE,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS states (
    sr_no      SERIAL PRIMARY KEY,
    state_id   UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    country_id UUID         NOT NULL REFERENCES countries (country_id),
    name       VARCHAR(100) NOT NULL,
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (country_id, name)
);

CREATE TABLE IF NOT EXISTS cities (
    sr_no     SERIAL PRIMARY KEY,
    city_id   UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    state_id  UUID         NOT NULL REFERENCES states (state_id),
    name      VARCHAR(100) NOT NULL,
    is_active BOOLEAN      NOT NULL DEFAULT TRUE,
    UNIQUE (state_id, name)
);

INSERT INTO countries (country_id, name, iso2, iso3, is_active)
VALUES ('313df106-720a-464d-a26c-fa483e5cc111', 'India', 'IN', 'IND', TRUE)
ON CONFLICT (country_id) DO NOTHING;

INSERT INTO states (state_id, country_id, name, is_active)
VALUES (
    'dbb4c54e-900a-40f2-9ab2-99826727c316',
    '313df106-720a-464d-a26c-fa483e5cc111',
    'Gujarat',
    TRUE
)
ON CONFLICT (country_id, name) DO NOTHING;

INSERT INTO cities (city_id, state_id, name, is_active)
VALUES (
    '4a55b6ed-1970-4e5b-805e-4cd602a78517',
    'dbb4c54e-900a-40f2-9ab2-99826727c316',
    'Surat',
    TRUE
)
ON CONFLICT (state_id, name) DO NOTHING;

-- migrate:down

DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS states;
DROP TABLE IF EXISTS countries;
