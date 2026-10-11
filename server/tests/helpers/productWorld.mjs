import { randomUUID } from "node:crypto";

export function createProductWorld({ taxCodes: initialTaxCodes = [] } = {}) {
  const taxCodesById = new Map(
    initialTaxCodes.map((row) => [
      row.tax_code_id,
      {
        tax_code_id: row.tax_code_id,
        type: row.type,
        code: row.code,
        description: row.description,
        cgst: row.cgst ?? 2.5,
        sgst: row.sgst ?? 2.5,
        igst: row.igst ?? 5,
      },
    ])
  );
  const productsById = new Map();
  let srNo = 0;

  const deps = {
    async getTaxCodeById(taxCodeId) {
      return taxCodesById.get(taxCodeId) ?? null;
    },

    async getProductById(productId) {
      return productsById.get(productId) ?? null;
    },

    async insertProduct(product) {
      const productId = randomUUID();
      srNo += 1;
      const row = {
        sr_no: srNo,
        product_id: productId,
        collection_id: product.collection_id,
        product_name: product.product_name,
        wholesale_price: product.wholesale_price,
        retail_price: product.retail_price,
        stock_in_hand: product.stock_in_hand,
        total_stock: product.total_stock,
        is_labour: product.is_labour,
        is_delete: false,
        tax_code_id: product.tax_code_id ?? null,
        created_at: new Date().toISOString(),
        updated_at: null,
      };
      productsById.set(productId, row);
      return { ...row };
    },

    async updateProduct(productId, product) {
      const existing = productsById.get(productId);
      if (!existing) {
        return null;
      }
      const updated = {
        ...existing,
        product_name: product.product_name,
        wholesale_price: product.wholesale_price,
        retail_price: product.retail_price,
        is_labour: product.is_labour,
        tax_code_id: product.tax_code_id,
        updated_at: new Date().toISOString(),
      };
      productsById.set(productId, updated);
      return { ...updated };
    },

    async listProducts({
      collectionId,
      limit,
      offset,
      search,
      sortColumn = "created_at",
      sortDirection = "DESC",
      unpaged = false,
    }) {
      const needle = String(search ?? "").toLowerCase();
      const all = [...productsById.values()]
        .filter(
          (row) =>
            row.collection_id === collectionId &&
            row.product_name.toLowerCase().includes(needle)
        )
        .sort((a, b) => {
          const aVal = a[sortColumn];
          const bVal = b[sortColumn];
          if (aVal === bVal) {
            return 0;
          }
          const asc = aVal < bVal ? -1 : 1;
          return sortDirection === "ASC" ? asc : -asc;
        });
      const rows = unpaged ? all : all.slice(offset, offset + limit);
      return {
        rows,
        totalCount: all.length,
      };
    },

  };

  function seedProduct(row) {
    const productId = row.product_id ?? randomUUID();
    srNo += 1;
    const stored = {
      sr_no: srNo,
      product_id: productId,
      collection_id: row.collection_id,
      product_name: row.product_name,
      wholesale_price: row.wholesale_price ?? 100,
      retail_price: row.retail_price ?? 120,
      stock_in_hand: row.stock_in_hand ?? 0,
      total_stock: row.total_stock ?? 0,
      is_labour: Boolean(row.is_labour),
      is_delete: false,
      tax_code_id: row.tax_code_id ?? null,
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? null,
    };
    productsById.set(productId, stored);
    return stored;
  }

  function insertTaxCode(row) {
    const taxCode = {
      tax_code_id: row.tax_code_id ?? randomUUID(),
      type: row.type,
      code: row.code,
      description: row.description,
      cgst: row.cgst ?? 2.5,
      sgst: row.sgst ?? 2.5,
      igst: row.igst ?? 5,
    };
    taxCodesById.set(taxCode.tax_code_id, taxCode);
    return taxCode;
  }

  function updateTaxCode(taxCodeId, patch) {
    const existing = taxCodesById.get(taxCodeId);
    if (!existing) {
      return null;
    }
    const updated = { ...existing, ...patch };
    taxCodesById.set(taxCodeId, updated);
    return updated;
  }

  return { deps, productsById, taxCodesById, seedProduct, insertTaxCode, updateTaxCode };
}

export function validProductPayload(overrides = {}) {
  return {
    product_name: "Cotton",
    wholesale_price: 100,
    retail_price: 120,
    is_labour: 0,
    tax_code_id: overrides.tax_code_id,
    ...overrides,
  };
}
