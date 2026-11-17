import { query } from "../utils/query.js";

const CLIENT_LIST_SELECT = `
  select
    c.sr_no,
    c.client_id,
    c.name,
    c.mobile,
    c.address,
    c.pincode,
    c.state_id,
    c.city_id,
    c.gst_number,
    c.gst_not_applicable,
    c.contact_person,
    c.contact_number,
    s.name as state_name,
    ci.name as city_name
  from clients c
  left join states s on c.state_id = s.state_id
  left join cities ci on c.city_id = ci.city_id
`;

export function createClientMaintenanceDeps() {
  return {
    async getClientByMobile(mobile) {
      const [client] = await query(`select * from clients where mobile = $1`, [mobile]);
      return client ?? null;
    },

    async getClientByGstNumber(gstNumber) {
      const [client] = await query(
        `select * from clients where gst_number = $1`,
        [gstNumber]
      );
      return client ?? null;
    },

    async getActiveStateInIndia(stateId) {
      const [state] = await query(
        `select s.state_id, s.name, s.is_active, s.country_id
         from states s
         inner join countries co on co.country_id = s.country_id
         where s.state_id = $1
           and s.is_active = true
           and co.iso2 = 'IN'`,
        [stateId]
      );
      return state ?? null;
    },

    async getActiveCity(cityId) {
      const [city] = await query(
        `select city_id, state_id, name, is_active
         from cities
         where city_id = $1 and is_active = true`,
        [cityId]
      );
      return city ?? null;
    },

    async getStateById(stateId) {
      const [state] = await query(
        `select state_id, name, is_active, country_id from states where state_id = $1`,
        [stateId]
      );
      return state ?? null;
    },

    async getCityById(cityId) {
      const [city] = await query(
        `select city_id, state_id, name, is_active from cities where city_id = $1`,
        [cityId]
      );
      return city ?? null;
    },

    async insertClient(row) {
      const [client] = await query(
        `insert into clients (
          name, mobile, address, pincode, state_id, city_id,
          gst_number, gst_not_applicable, contact_person, contact_number
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning *`,
        [
          row.name,
          row.mobile,
          row.address,
          row.pincode,
          row.state_id,
          row.city_id,
          row.gst_number,
          row.gst_not_applicable ?? false,
          row.contact_person,
          row.contact_number,
        ]
      );
      return client;
    },

    async insertBillClient(row) {
      const [client] = await query(
        `insert into clients (name, mobile, address) values ($1, $2, $3) returning *`,
        [row.name, row.mobile, row.address]
      );
      return client;
    },

    async updateClientNameAndAddress(clientId, { name, address }) {
      const [client] = await query(
        `update clients set name = $1, address = $2 where client_id = $3 returning *`,
        [name, address, clientId]
      );
      return client;
    },

    async updateClient(mobile, row) {
      const [client] = await query(
        `update clients set
          name = $1,
          address = $2,
          pincode = $3,
          state_id = $4,
          city_id = $5,
          gst_number = $6,
          gst_not_applicable = $7,
          contact_person = $8,
          contact_number = $9
        where mobile = $10
        returning *`,
        [
          row.name,
          row.address,
          row.pincode,
          row.state_id,
          row.city_id,
          row.gst_number,
          row.gst_not_applicable ?? false,
          row.contact_person,
          row.contact_number,
          mobile,
        ]
      );
      return client;
    },
  };
}

export async function getClientByMobileWithLocation(mobile) {
  const [client] = await query(
    `${CLIENT_LIST_SELECT} where c.mobile = $1`,
    [mobile]
  );
  return client ?? null;
}

function clientSearchMatchesGstNotApplicable(search) {
  return typeof search === "string" && search.trim().toLowerCase() === "n/a";
}

const CLIENT_SEARCH_PATTERN = (paramIndex, { matchGstNotApplicable = false } = {}) => `(
    c.name ilike $${paramIndex}
    or c.mobile ilike $${paramIndex}
    or c.address ilike $${paramIndex}
    or c.pincode ilike $${paramIndex}
    or c.gst_number ilike $${paramIndex}${matchGstNotApplicable ? "\n    or c.gst_not_applicable" : ""}
    or c.contact_person ilike $${paramIndex}
    or c.contact_number ilike $${paramIndex}
    or ci.name ilike $${paramIndex}
  )`;

export async function listAllClientsWithLocation() {
  return query(`${CLIENT_LIST_SELECT} order by c.sr_no desc`);
}

export async function listClientsPaginated({ search, limit, offset }) {
  const queryParams = [];
  let whereClause = "";

  if (search) {
    queryParams.push(`%${search}%`);
    const matchGstNotApplicable = clientSearchMatchesGstNotApplicable(search);
    whereClause = ` where ${CLIENT_SEARCH_PATTERN(1, {
      matchGstNotApplicable,
    })}`;
  }

  const clients = await query(
    `${CLIENT_LIST_SELECT}${whereClause} order by c.sr_no desc limit $${queryParams.length + 1} offset $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  const countSql = search
    ? `select count(*) from clients c
       left join cities ci on c.city_id = ci.city_id
       ${whereClause}`
    : `select count(*) from clients`;
  const totalClients = await query(countSql, search ? queryParams : []);

  return { clients, totalCount: Number(totalClients[0].count) };
}
