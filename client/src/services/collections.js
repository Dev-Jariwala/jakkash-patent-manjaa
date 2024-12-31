import axios from "axios";
const token = localStorage.getItem("token");
axios.defaults.headers.common["Authorization"] = token;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// router.get("/", collectionControllers.getCollections);
// router.post("/", collectionValidators.validateCreateCollection, collectionControllers.createCollection);
// router.put("/:collection_id", collectionValidators.validateCreateCollection, collectionControllers.updateCollection);
export async function getCollectionsOptions() {
  const response = await axios({
    method: "GET",
    url: `${BACKEND_URL}collections`,
  });
  return response;
}

export async function createCollection(data) {
  const response = await axios({
    method: "POST",
    url: `${BACKEND_URL}collections`,
    data,
  });
  return response;
}

export async function updateCollection({collection_id, data}) {
  const response = await axios({
    method: "PUT",
    url: `${BACKEND_URL}collections/${collection_id}`,
    data,
  });
  return response;
}

// router.get("/:collection_id", collectionControllers.getCollectionById);

export async function getCollectionById(collection_id) {
  const response = await axios({
    method: "GET",
    url: `${BACKEND_URL}collections/${collection_id}`,
  });
  return response;
}