import axios from "axios";
const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;

// router.get("/", clientControllers.getClients);

export const getClients = async ({ pagination, debouncedSearch }) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}clients?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}&search=${debouncedSearch}`,
        params: {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
        },
    });
    return response;
}

// router.get("/:mobile", clientControllers.getClientByMobileNumber);

export const getClientByMobileNumber = async (mobile) => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}clients/${mobile}`,
    });
    return response;
}

// router.get("/all", clientControllers.getAllClients);

export const getAllClients = async () => {
    const response = await axios({
        method: "GET",
        url: `${import.meta.env.VITE_BACKEND_URL}clients/all`,
    });
    return response;
}