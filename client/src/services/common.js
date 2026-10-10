import axios from "axios";

const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;

export const getCountries = async () => {
  const response = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}common/countries`,
  });
  return response;
};

export const getStates = async (country_id) => {
  const response = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}common/states`,
    params: country_id ? { country_id } : {},
  });
  return response;
};

export const getCities = async (state_id) => {
  const response = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}common/cities`,
    params: state_id ? { state_id } : {},
  });
  return response;
};

const mastersListParams = ({ pageIndex, pageSize }) => ({
  page: pageIndex + 1,
  limit: pageSize,
});

export const getMastersCountries = async ({ pageIndex, pageSize }) => {
  const response = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}common/masters/countries`,
    params: mastersListParams({ pageIndex, pageSize }),
  });
  return response;
};

export const getMastersStates = async ({ pageIndex, pageSize }) => {
  const response = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}common/masters/states`,
    params: mastersListParams({ pageIndex, pageSize }),
  });
  return response;
};

export const getMastersCities = async ({ pageIndex, pageSize }) => {
  const response = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}common/masters/cities`,
    params: mastersListParams({ pageIndex, pageSize }),
  });
  return response;
};
