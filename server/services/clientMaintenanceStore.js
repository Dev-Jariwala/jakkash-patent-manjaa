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

    async insertClient(row) {
      const [client] = await query(
        `insert into clients (
          name, mobile, address, pincode, state_id, city_id,
          gst_number, contact_person, contact_number
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning *`,
        [
          row.name,
          row.mobile,
          row.address,
          row.pincode,
          row.state_id,
          row.city_id,
          row.gst_number,
          row.contact_person,
          row.contact_number,
        ]
      );
      return client;
    },
  };
}

export async function listClientsPaginated({ search, limit, offset }) {
  const queryParams = [];
  let whereClause = "";

  if (search) {
    whereClause = ` where c.name ilike $1 or c.mobile ilike $1 or c.address ilike $1`;
    queryParams.push(`%${search}%`);
  }

  const clients = await query(
    `${CLIENT_LIST_SELECT}${whereClause} order by c.sr_no desc limit $${queryParams.length + 1} offset $${queryParams.length + 2}`,
    [...queryParams, limit, offset]
  );

  const countSql = search
    ? `select count(*) from clients c${whereClause}`
    : `select count(*) from clients`;
  const totalClients = await query(countSql, search ? [`%${search}%`] : []);

  return { clients, totalCount: Number(totalClients[0].count) };
}
