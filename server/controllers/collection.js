// controllers/collection.js
import { handleError } from "../utils/error.js";
import { query } from "../utils/query.js";
import { parseBillYear } from "../services/billYear.js";
import { copyProductsToCollection } from "../services/product.js";
import { createProductDeps } from "../services/productStore.js";

/* -- Table: collections
CREATE TABLE collections (
  sr_no SERIAL PRIMARY KEY,
    collection_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_name VARCHAR(50) NOT NULL,
    bill_year VARCHAR(20)
);
*/

export const createCollection = async (req, res) => {
  try {
    const { collection_name, copy_collection_id } = req.body;
    const billYear = parseBillYear(req.body?.bill_year);
    const [newCollection] = await query(
      "INSERT INTO collections (collection_name, bill_year) VALUES ($1, $2) returning *",
      [collection_name, billYear]
    );
    if (!newCollection) {
      res.status(400).json({ error: "Error creating collection" });
      return;
    }
    if (copy_collection_id) {
      await copyProductsToCollection(
        createProductDeps(),
        copy_collection_id,
        newCollection.collection_id
      );
    }

    res.status(201).json({
      message: "Collection created successfully",
      collection: newCollection,
    });
  } catch (error) {
    handleError('createCollection', res, error);
  }
};

export const getCollections = async (req, res) => {
  try {
    const collections = await query("SELECT * FROM collections order by sr_no asc");
    res.status(200).json({ collections });
  } catch (error) {
    handleError('getCollections', res, error);
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { collection_id } = req.params;
    const { collection_name } = req.body;
    const billYear = parseBillYear(req.body?.bill_year);
    const [updatedCollection] = await query(
      "UPDATE collections SET collection_name=$1, bill_year=$2 WHERE collection_id=$3 RETURNING *",
      [collection_name, billYear, collection_id]
    );
    if (!updatedCollection) {
      res.status(404).json({ error: "Collection not found" });
      return;
    }
    res.status(200).json({
      message: "Collection updated successfully",
      collection: updatedCollection,
    });
  } catch (error) {
    handleError('updateCollection', res, error);
  }
}

export const getCollectionById = async (req, res) => {
  try {
    const { collection_id } = req.params;
    const [collection] = await query(
      "SELECT * FROM collections WHERE collection_id=$1",
      [collection_id]
    );
    if (!collection) {
      res.status(404).json({ error: "Collection not found" });
    }
    res.status(200).json({ collection });
  } catch (error) {
    handleError('getCollectionById', res, error);
  }
}