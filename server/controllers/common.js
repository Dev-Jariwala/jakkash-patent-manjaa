import { handleError } from "../utils/error.js";
import { query } from "../utils/query.js";

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
