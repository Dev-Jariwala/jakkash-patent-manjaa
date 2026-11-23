import { query, withTransaction } from "../utils/query.js";

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

    async getNextDisplayPosition(collectionId) {
      const [row] = await query(
        `select coalesce(max(display_position), 0)::int as max_position
         from products
         where collection_id = $1`,
        [collectionId]
      );
      return (row?.max_position ?? 0) + 1;
    },

    async insertProduct(product) {
      const [inserted] = await query(
        `insert into products (
           collection_id, product_name, wholesale_price, retail_price,
           stock_in_hand, total_stock, is_labour, tax_code_id, is_active,
           display_position
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          product.is_active !== false,
          product.display_position,
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
             is_active = $6,
             updated_at = now()
         where product_id = $7
         returning *`,
        [
          product.product_name,
          product.wholesale_price,
          product.retail_price,
          product.is_labour,
          product.tax_code_id,
          product.is_active !== false,
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
         order by display_position asc`,
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
      status = "active",
    }) {
      const searchQuery = `%${String(search ?? "").toLowerCase()}%`;
      const statusSql =
        status === "all"
          ? ""
          : status === "inactive"
            ? " and is_active = false"
            : " and is_active = true";

      const countParams = [collectionId, searchQuery];
      const [totalCountResult] = await query(
        `select count(*)::int as total_count
         from products
         where collection_id = $1
           and product_name ilike $2${statusSql}`,
        countParams
      );

      let listSql = `select * from products
         where collection_id = $1
           and product_name ilike $2${statusSql}
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

    async reorderProductDisplayOrder(collectionId, productIds) {
      await withTransaction(async (txQuery) => {
        await txQuery(
          `update products
           set display_position = -display_position
           where collection_id = $1`,
          [collectionId]
        );

        for (let index = 0; index < productIds.length; index += 1) {
          await txQuery(
            `update products
             set display_position = $1,
                 updated_at = now()
             where product_id = $2
               and collection_id = $3`,
            [index + 1, productIds[index], collectionId]
          );
        }
      });
    },
  };
}
