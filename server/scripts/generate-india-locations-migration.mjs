/**
 * Builds server/migrations/013_seed_india_states_and_cities.sql from API JSON dumps.
 *
 * Usage (from server/):
 *   node scripts/generate-india-locations-migration.mjs \
 *     --states ../temp-state.json --cities ../temp-city.json
 *
 * Source JSON is not committed; only the generated migration is.
 *
 * States/UTs are limited to countryid 101 and vetted against India's 28 states + 8 UTs
 * (MHA / knowindia). Five non-admin rows with no cities are excluded.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(scriptDir, '..');

const INDIA_COUNTRY_ID = '313df106-720a-464d-a26c-fa483e5cc111';
const GUJARAT_STATE_ID = 'dbb4c54e-900a-40f2-9ab2-99826727c316';
const SURAT_CITY_ID = '4a55b6ed-1970-4e5b-805e-4cd602a78517';

const INDIA_API_COUNTRY_ID = 101;

/** Not states/UTs — districts/places or corrupt rows (0 cities in source). */
const EXCLUDED_API_STATE_IDS = new Set([18, 27, 28, 30, 40]);

/** API label → official name (MHA / ISO-style UT naming). */
const STATE_NAME_OVERRIDES = {
  'Dadra and Nagar Haveli and Dam': 'Dadra and Nagar Haveli and Daman and Diu',
};

const GUJARAT_API_STATE_ID = 12;
const SURAT_API_CITY_ID = 1041;

function parseArgs(argv) {
  const opts = {
    states: path.join(serverRoot, '..', 'temp-state.json'),
    cities: path.join(serverRoot, '..', 'temp-city.json'),
    out: path.join(serverRoot, 'migrations', '013_seed_india_states_and_cities.sql'),
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--states' && argv[i + 1]) opts.states = argv[++i];
    else if (argv[i] === '--cities' && argv[i + 1]) opts.cities = argv[++i];
    else if (argv[i] === '--out' && argv[i + 1]) opts.out = argv[++i];
  }
  return opts;
}

function uuidV5(name, namespaceUuid) {
  const hex = namespaceUuid.replace(/-/g, '');
  const ns = Buffer.from(hex, 'hex');
  const hash = createHash('sha1');
  hash.update(ns);
  hash.update(name, 'utf8');
  const bytes = Buffer.from(hash.digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = bytes.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function stateUuid(apiStateId) {
  if (apiStateId === GUJARAT_API_STATE_ID) return GUJARAT_STATE_ID;
  return uuidV5(`india-state:${apiStateId}`, INDIA_COUNTRY_ID);
}

function cityUuid(apiCityId, apiStateId, cityName) {
  if (
    apiCityId === SURAT_API_CITY_ID &&
    apiStateId === GUJARAT_API_STATE_ID &&
    cityName.trim() === 'Surat'
  ) {
    return SURAT_CITY_ID;
  }
  return uuidV5(`india-city:${apiCityId}`, INDIA_COUNTRY_ID);
}

function sqlLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function batchedInsert(table, columns, rows, batchSize = 250) {
  if (rows.length === 0) return [];
  const lines = [];
  const colList = columns.join(', ');
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const values = chunk
      .map((row) =>
        `(${row
          .map((v) => {
            if (v === true) return 'TRUE';
            if (v === false) return 'FALSE';
            return sqlLiteral(v);
          })
          .join(', ')})`
      )
      .join(',\n    ');
    lines.push(`INSERT INTO ${table} (${colList})\nVALUES\n    ${values}\nON CONFLICT DO NOTHING;`);
  }
  return lines;
}

function canonicalStateName(raw) {
  const trimmed = raw.trim();
  return STATE_NAME_OVERRIDES[trimmed] ?? trimmed;
}

function loadJson(filePath) {
  const payload = JSON.parse(readFileSync(filePath, 'utf8'));
  if (!Array.isArray(payload.data)) {
    throw new Error(`${filePath}: expected { data: [...] }`);
  }
  return payload.data;
}

const OFFICIAL_36 = new Set([
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]);

function main() {
  const { states: statesPath, cities: citiesPath, out: outPath } = parseArgs(process.argv);

  const allStates = loadJson(statesPath);
  const allCities = loadJson(citiesPath);

  const indiaStates = allStates
    .filter((s) => s.countryid === INDIA_API_COUNTRY_ID)
    .filter((s) => !EXCLUDED_API_STATE_IDS.has(s.id))
    .map((s) => ({
      apiId: s.id,
      name: canonicalStateName(s.state),
      stateId: stateUuid(s.id),
    }));

  if (indiaStates.length !== 36) {
    throw new Error(`Expected 36 India states/UTs after filter, got ${indiaStates.length}`);
  }

  const names = new Set(indiaStates.map((s) => s.name));
  for (const official of OFFICIAL_36) {
    if (!names.has(official)) {
      throw new Error(`Missing official state/UT after mapping: ${official}`);
    }
  }
  for (const s of indiaStates) {
    if (!OFFICIAL_36.has(s.name)) {
      throw new Error(`Unexpected state name in seed set: ${s.name} (api id ${s.apiId})`);
    }
    if (s.name.length > 100) {
      throw new Error(`State name too long: ${s.name}`);
    }
  }

  const apiStateIdToRow = new Map(indiaStates.map((s) => [s.apiId, s]));

  const indiaCities = allCities
    .filter((c) => apiStateIdToRow.has(c.stateid))
    .map((c) => {
      const state = apiStateIdToRow.get(c.stateid);
      const name = c.city.trim();
      if (name.length > 100) {
        throw new Error(`City name too long (id ${c.id}): ${name}`);
      }
      return {
        apiId: c.id,
        name,
        stateId: state.stateId,
        apiStateId: c.stateid,
      };
    });

  const cityKey = new Set();
  for (const c of indiaCities) {
    const key = `${c.stateId}\0${c.name.toLowerCase()}`;
    if (cityKey.has(key)) {
      throw new Error(`Duplicate city in state: ${c.name}`);
    }
    cityKey.add(key);
  }

  const stateRows = indiaStates.map((s) => [s.stateId, INDIA_COUNTRY_ID, s.name, true]);
  const cityRows = indiaCities.map((c) => [
    cityUuid(c.apiId, c.apiStateId, c.name),
    c.stateId,
    c.name,
    true,
  ]);

  const stateInserts = batchedInsert(
    'states',
    ['state_id', 'country_id', 'name', 'is_active'],
    stateRows
  );
  const cityInserts = batchedInsert('cities', ['city_id', 'state_id', 'name', 'is_active'], cityRows);

  const header = `-- India's 28 states and 8 union territories plus cities (source API, countryid 101).
-- State/UT names aligned with MHA / National Portal listings; five non-admin API rows excluded.
-- Gujarat and Surat keep the UUIDs from migration 004. Other ids are deterministic (UUID v5).
-- Cities are not re-sourced from LGD; they are localities from the API under each vetted state/UT.
--
-- Regenerate: node scripts/generate-india-locations-migration.mjs (see script header).

-- migrate:up

`;

  const up = [...stateInserts, '', ...cityInserts].join('\n\n');

  const down = `-- migrate:down

DELETE FROM cities
WHERE city_id <> ${sqlLiteral(SURAT_CITY_ID)};

DELETE FROM states
WHERE country_id = ${sqlLiteral(INDIA_COUNTRY_ID)}
  AND state_id <> ${sqlLiteral(GUJARAT_STATE_ID)};
`;

  writeFileSync(outPath, header + up + '\n\n' + down, 'utf8');

  console.log(`Wrote ${outPath}`);
  console.log(`  states: ${indiaStates.length}`);
  console.log(`  cities: ${indiaCities.length}`);
}

main();
