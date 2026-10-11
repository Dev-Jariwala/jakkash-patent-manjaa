import { handleError } from "../utils/error.js";
import { query } from "../utils/query.js";
import { createProduct, getProduct, listProducts, updateProduct } from "../services/product.js";
import { createProductDeps } from "../services/productStore.js";

export const createProductHandler = async (req, res) => {
  try {
    const { collection_id } = req.params;
    const product = await createProduct(createProductDeps(), collection_id, req.body);
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    handleError("createProduct", res, error);
  }
};

export const getProductsByCollectionId = async (req, res) => {
  const { collection_id } = req.params;
  const { page = 1, limit = 10, sortField, sortOrder, search = "" } = req.query;

  try {
    const { products, totalCount, pagination } = await listProducts(createProductDeps(), {
      collectionId: collection_id,
      page,
      limit,
      search,
      sortField,
      sortOrder,
    });

    const responsePage = pagination.unpaged ? -1 : pagination.page;
    const responseLimit = pagination.unpaged
      ? totalCount
      : pagination.limit;
    const totalPages = pagination.unpaged
      ? 1
      : Math.ceil(totalCount / pagination.limit);
    const nextPage =
      pagination.unpaged || pagination.page >= totalPages ? null : pagination.page + 1;

    res.status(200).json({
      total: totalCount,
      page: responsePage,
      limit: responseLimit,
      totalPages,
      totalProducts: totalCount,
      nextPage,
      products,
    });
  } catch (error) {
    handleError("getProductsByCollectionId", res, error);
  }
};

export const updateProductById = async (req, res) => {
  try {
    const { product_id } = req.params;
    const updatedProduct = await updateProduct(createProductDeps(), product_id, req.body);
    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    handleError("updateProductById", res, error);
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const { product_id, collection_id } = req.params;
    const product = req.product;
    const [updatedProduct] = await query(
      "UPDATE products SET is_delete = $1 WHERE product_id = $2 AND collection_id = $3 RETURNING *",
      [!product.is_delete, product_id, collection_id]
    );

    res.status(200).json({
      message: `product ${product.is_delete ? "restored" : "deleted"} successfuly`,
      product: updatedProduct,
    });
  } catch (error) {
    handleError("deleteProductById", res, error);
  }
};

export const getProductById = async (req, res) => {
  try {
    const { product_id } = req.params;
    const product = await getProduct(createProductDeps(), product_id);
    if (!product) {
      return res.status(400).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (error) {
    handleError("getProductById", res, error);
  }
};

export const getProductsReport = async (req, res) => {
  const { collection_id } = req.params;
  try {
    const productsReport = await query(
      `
      SELECT 
        p.product_id, 
        p.product_name, 
        SUM(CASE WHEN b.order_type = 'retail' THEN bi.quantity ELSE 0 END) as retail_quantity,
        SUM(CASE WHEN b.order_type = 'wholesale' THEN bi.quantity ELSE 0 END) as wholesale_quantity,
        SUM(CASE WHEN b.order_type = 'retail' THEN bi.quantity * bi.price ELSE 0 END) as retail_amount,
        SUM(CASE WHEN b.order_type = 'wholesale' THEN bi.quantity * bi.price ELSE 0 END) as wholesale_amount
      FROM products p
      LEFT JOIN order_items bi ON p.product_id = bi.product_id
      LEFT JOIN orders b ON bi.order_id = b.order_id
      WHERE p.collection_id = $1
      GROUP BY p.product_id, p.product_name
      ORDER BY p.product_name
      `,
      [collection_id]
    );
    res.status(200).json({ products: productsReport });
  } catch (error) {
    handleError("getProductsReport", res, error);
  }
};
