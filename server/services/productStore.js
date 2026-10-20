import { query } from "../utils/query.js";

export function createProductDeps() {
  return {
    async getTaxCodeById(taxCodeId) {
      const [row] = await query(
        `select tax_code_id, type, code, description, cgst, sgst, igst
         from tax_codes
         where tax_code_id = $1`,
        [taxCodeId]
      );
      return row ?? null;
    },

    async getProductById(productId) {
      const [row] = await query(`select * from products where product_id = $1`, [productId]);
      return row ?? null;
    },

    async insertProduct(product) {
      const [inserted] = await query(
        `insert into products (
           collection_id, product_name, wholesale_price, retail_price,
           stock_in_hand, total_stock, is_labour, tax_code_id
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning *`,
        [
          product.collection_id,
          product.product_name,
          product.wholesale_price,
          product.retail_price,
          product.stock_in_hand,
          product.total_stock,
          product.is_labour,
          product.tax_code_id,
        ]
      );
      return inserted;
    },

    async updateProduct(productId, product) {
      const [updated] = await query(
        `update products
         set product_name = $1,
             wholesale_price = $2,
             retail_price = $3,
             is_labour = $4,
             tax_code_id = $5,
             updated_at = now()
         where product_id = $6
         returning *`,
        [
          product.product_name,
          product.wholesale_price,
          product.retail_price,
          product.is_labour,
          product.tax_code_id,
          productId,
        ]
      );
      return updated ?? null;
    },

    async listProductsForCollectionCopy(collectionId) {
      return query(
        `select *
         from products
         where collection_id = $1
         order by sr_no asc`,
        [collectionId]
      );
    },

    async listProducts({
      collectionId,
      limit,
      offset,
      search,
      sortColumn,
      sortDirection,
      unpaged,
    }) {
      const searchQuery = `%${String(search ?? "").toLowerCase()}%`;

      const countParams = [collectionId, searchQuery];
      const [totalCountResult] = await query(
        `select count(*)::int as total_count
         from products
         where collection_id = $1
           and product_name ilike $2`,
        countParams
      );

      let listSql = `select * from products
         where collection_id = $1
           and product_name ilike $2
         order by ${sortColumn} ${sortDirection}`;
      const listParams = [collectionId, searchQuery];

      if (!unpaged) {
        listSql += ` limit $3 offset $4`;
        listParams.push(limit, offset);
      }

      const products = await query(listSql, listParams);

      return {
        rows: products,
        totalCount: totalCountResult?.total_count ?? 0,
      };
    },
  };
}
