import { randomUUID } from "node:crypto";

export const INDIA_COUNTRY_ID = "313df106-720a-464d-a26c-fa483e5cc111";
export const GUJARAT_STATE_ID = "dbb4c54e-900a-40f2-9ab2-99826727c316";
export const SURAT_CITY_ID = "4a55b6ed-1970-4e5b-805e-4cd602a78517";

const VALID_GST = "24AABCU9603R1ZM";

export function createClientMaintenanceWorld({
  states = [],
  cities = [],
} = {}) {
  const clientsByMobile = new Map();
  const clientsByGst = new Map();

  const defaultStates = [
    {
      state_id: GUJARAT_STATE_ID,
      country_id: INDIA_COUNTRY_ID,
      name: "Gujarat",
      is_active: true,
    },
  ];

  const defaultCities = [
    {
      city_id: SURAT_CITY_ID,
      state_id: GUJARAT_STATE_ID,
      name: "Surat",
      is_active: true,
    },
  ];

  const stateRows = [...defaultStates, ...states];
  const cityRows = [...defaultCities, ...cities];

  const stateById = new Map(stateRows.map((s) => [s.state_id, s]));
  const cityById = new Map(cityRows.map((c) => [c.city_id, c]));

  const deps = {
    async getClientByMobile(mobile) {
      return clientsByMobile.get(mobile) ?? null;
    },

    async getClientByGstNumber(gstNumber) {
      const mobile = clientsByGst.get(gstNumber);
      return mobile ? clientsByMobile.get(mobile) : null;
    },

    async getActiveStateInIndia(stateId) {
      const state = stateById.get(stateId);
      if (!state || !state.is_active || state.country_id !== INDIA_COUNTRY_ID) {
        return null;
      }
      return state;
    },

    async getActiveCity(cityId) {
      const city = cityById.get(cityId);
      if (!city || !city.is_active) {
        return null;
      }
      return city;
    },

    async getStateById(stateId) {
      return stateById.get(stateId) ?? null;
    },

    async getCityById(cityId) {
      return cityById.get(cityId) ?? null;
    },

    async insertClient(row) {
      const client = {
        client_id: randomUUID(),
        pincode: null,
        state_id: null,
        city_id: null,
        gst_number: null,
        contact_person: null,
        contact_number: null,
        ...row,
      };
      clientsByMobile.set(row.mobile, client);
      if (row.gst_number) {
        clientsByGst.set(row.gst_number, row.mobile);
      }
      return client;
    },

    async insertBillClient(row) {
      return deps.insertClient({
        name: row.name,
        mobile: row.mobile,
        address: row.address,
        pincode: null,
        state_id: null,
        city_id: null,
        gst_number: null,
        contact_person: null,
        contact_number: null,
      });
    },

    async updateClientNameAndAddress(clientId, { name, address }) {
      const client = [...clientsByMobile.values()].find((c) => c.client_id === clientId);
      if (!client) {
        throw new Error("client not found");
      }
      client.name = name;
      client.address = address;
      clientsByMobile.set(client.mobile, client);
      return client;
    },

    async updateClient(mobile, row) {
      const existing = clientsByMobile.get(mobile);
      if (!existing) {
        throw new Error("client not found");
      }
      if (existing.gst_number) {
        clientsByGst.delete(existing.gst_number);
      }
      const client = {
        ...existing,
        ...row,
        mobile,
      };
      clientsByMobile.set(mobile, client);
      if (client.gst_number) {
        clientsByGst.set(client.gst_number, mobile);
      }
      return client;
    },
  };

  return {
    deps,
    clientsByMobile,
    clientsByGst,
    stateById,
    cityById,
    validGst: VALID_GST,
  };
}

export function validCreatePayload(overrides = {}) {
  return {
    name: "Acme Traders",
    mobile: "9876543210",
    address: "Ring Road",
    state_id: GUJARAT_STATE_ID,
    city_id: SURAT_CITY_ID,
    ...overrides,
  };
}

export function validUpdatePayload(overrides = {}) {
  const { mobile: _mobile, ...rest } = validCreatePayload(overrides);
  return rest;
}
