import axios from "axios";
const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;

export const getProductsByCollectionId = async ({
  activeCollection,
  pagination,
  debouncedSearch = "",
  status,
}) => {
  const response = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/products?page=${pagination?.pageIndex + 1}&limit=${pagination?.pageSize}&search=${debouncedSearch}`,
    params: {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      ...(status ? { status } : {}),
    },
  });
  return response;
}
export async function createProduct({ activeCollection, data }) {
  const res = await axios({
    method: "POST",
    url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/products`,
    data,
  });
  return res;
}
export async function updateProductById({ activeCollection, product_id, data }) {
  const res = await axios({
    method: "PUT",
    url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/products/${product_id}`,
    data,
  });
  return res;
}
export async function getProductById({ activeCollection, product_id }) {
  const res = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/products/${product_id}`,
  });
  return res;
}

export async function getProductsReport({ collection_id }) {
  const res = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}collections/${collection_id}/products/report`,
  });
  return res;
}

export async function reorderProductDisplayOrder({ activeCollection, product_ids }) {
  const res = await axios({
    method: "PUT",
    url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/products/display-order`,
    data: { product_ids },
  });
  return res;
}

export async function getProductsInDisplayOrder({ activeCollection }) {
  const res = await axios({
    method: "GET",
    url: `${import.meta.env.VITE_BACKEND_URL}collections/${activeCollection}/products`,
    params: {
      page: -1,
      status: "all",
      sortField: "display_position",
      sortOrder: "asc",
    },
  });
  return res;
}