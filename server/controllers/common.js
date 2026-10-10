import { handleError } from "../utils/error.js";
import { query } from "../utils/query.js";
import { createTaxCode, listTaxCodes, updateTaxCode } from "../services/taxCodeMaintenance.js";
import { createTaxCodeMaintenanceDeps } from "../services/taxCodeMaintenanceStore.js";
import {
  getShopBankAccount,
  saveShopBankAccount,
} from "../services/shopBankAccount.js";
import { createShopBankAccountDeps } from "../services/shopBankAccountStore.js";

function parseMastersListPagination(queryParams) {
  const { page = 1, limit = 10 } = queryParams;
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 10)
  );
  const offset = (parsedPage - 1) * parsedLimit;
  return { page: parsedPage, limit: parsedLimit, offset };
}

function mastersListResponse({ rows, totalCount, page, limit, key }) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  return {
    [key]: rows,
    totalCount,
    totalPages,
    page,
    limit,
  };
}

export const getCountries = async (req, res) => {
  try {
    const countries = await query(
      `select sr_no, country_id, name, iso2, iso3, is_active
       from countries
       order by name`
    );
    res.status(200).json({ countries });
  } catch (error) {
    handleError("getCountries", res, error);
  }
};

export const getStates = async (req, res) => {
  const { country_id } = req.query;
  try {
    const params = [];
    let sql = `select sr_no, state_id, country_id, name, is_active from states where is_active = true`;
    if (country_id) {
      params.push(country_id);
      sql += ` and country_id = $1`;
    }
    sql += ` order by name`;
    const states = await query(sql, params);
    res.status(200).json({ states });
  } catch (error) {
    handleError("getStates", res, error);
  }
};

export const getCities = async (req, res) => {
  const { state_id } = req.query;
  try {
    const params = [];
    let sql = `select sr_no, city_id, state_id, name, is_active from cities where is_active = true`;
    if (state_id) {
      params.push(state_id);
      sql += ` and state_id = $1`;
    }
    sql += ` order by name`;
    const cities = await query(sql, params);
    res.status(200).json({ cities });
  } catch (error) {
    handleError("getCities", res, error);
  }
};

export const getMastersCountries = async (req, res) => {
  const { page, limit, offset } = parseMastersListPagination(req.query);
  try {
    const [{ count: totalCount }] = await query(
      `select count(*)::int as count from countries`
    );
    const countries = await query(
      `select sr_no, country_id, name, iso2, iso3, is_active
       from countries
       order by name
       limit $1 offset $2`,
      [limit, offset]
    );
    res.status(200).json(
      mastersListResponse({
        rows: countries,
        totalCount,
        page,
        limit,
        key: "countries",
      })
    );
  } catch (error) {
    handleError("getMastersCountries", res, error);
  }
};

export const getMastersStates = async (req, res) => {
  const { page, limit, offset } = parseMastersListPagination(req.query);
  try {
    const [{ count: totalCount }] = await query(
      `select count(*)::int as count from states`
    );
    const states = await query(
      `select s.sr_no, s.state_id, s.name, s.is_active, c.name as country_name
       from states s
       inner join countries c on c.country_id = s.country_id
       order by c.name, s.name
       limit $1 offset $2`,
      [limit, offset]
    );
    res.status(200).json(
      mastersListResponse({
        rows: states,
        totalCount,
        page,
        limit,
        key: "states",
      })
    );
  } catch (error) {
    handleError("getMastersStates", res, error);
  }
};

export const getMastersCities = async (req, res) => {
  const { page, limit, offset } = parseMastersListPagination(req.query);
  try {
    const [{ count: totalCount }] = await query(
      `select count(*)::int as count from cities`
    );
    const cities = await query(
      `select ci.sr_no, ci.city_id, ci.name, ci.is_active, s.name as state_name
       from cities ci
       inner join states s on s.state_id = ci.state_id
       order by s.name, ci.name
       limit $1 offset $2`,
      [limit, offset]
    );
    res.status(200).json(
      mastersListResponse({
        rows: cities,
        totalCount,
        page,
        limit,
        key: "cities",
      })
    );
  } catch (error) {
    handleError("getMastersCities", res, error);
  }
};

export const getMastersTaxCodes = async (req, res) => {
  const { page, limit, offset } = parseMastersListPagination(req.query);
  try {
    const { taxCodes, totalCount } = await listTaxCodes(createTaxCodeMaintenanceDeps(), {
      limit,
      offset,
    });
    res.status(200).json(
      mastersListResponse({
        rows: taxCodes,
        totalCount,
        page,
        limit,
        key: "tax_codes",
      })
    );
  } catch (error) {
    handleError("getMastersTaxCodes", res, error);
  }
};

export const createMastersTaxCode = async (req, res) => {
  try {
    const taxCode = await createTaxCode(createTaxCodeMaintenanceDeps(), req.body);
    res.status(201).json({ tax_code: taxCode });
  } catch (error) {
    handleError("createMastersTaxCode", res, error);
  }
};

export const updateMastersTaxCode = async (req, res) => {
  const { tax_code_id } = req.params;
  try {
    const taxCode = await updateTaxCode(createTaxCodeMaintenanceDeps(), tax_code_id, req.body);
    res.status(200).json({ tax_code: taxCode });
  } catch (error) {
    handleError("updateMastersTaxCode", res, error);
  }
};

export const getShopBankAccountHandler = async (req, res) => {
  try {
    const shopBankAccount = await getShopBankAccount(createShopBankAccountDeps());
    res.status(200).json({ shop_bank_account: shopBankAccount });
  } catch (error) {
    handleError("getShopBankAccount", res, error);
  }
};

export const saveShopBankAccountHandler = async (req, res) => {
  try {
    const shopBankAccount = await saveShopBankAccount(
      createShopBankAccountDeps(),
      req.body
    );
    res.status(200).json({ shop_bank_account: shopBankAccount });
  } catch (error) {
    handleError("saveShopBankAccount", res, error);
  }
};
