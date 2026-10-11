import {
  ProductNotFoundError,
  ProductTaxCodeCategoryMismatchError,
  ProductTaxCodeNotFoundError,
  ProductTaxCodeRequiredError,
  ProductValidationError,
} from "./productErrors.js";

export const PRODUCT_SORT_FIELDS = {
  sr_no: "sr_no",
  product_name: "product_name",
  wholesale_price: "wholesale_price",
  retail_price: "retail_price",
  stock_in_hand: "stock_in_hand",
  total_stock: "total_stock",
  is_labour: "is_labour",
  created_at: "created_at",
  updated_at: "updated_at",
};

const DEFAULT_PRODUCT_SORT_FIELD = "created_at";

export function resolveProductsListOrdering({ sortField, sortOrder }) {
  const column = Object.hasOwn(PRODUCT_SORT_FIELDS, String(sortField ?? ""))
    ? PRODUCT_SORT_FIELDS[sortField]
    : DEFAULT_PRODUCT_SORT_FIELD;

  return {
    column,
    direction: String(sortOrder ?? "desc").toLowerCase() === "asc" ? "ASC" : "DESC",
  };
}

export function resolveProductsListPagination({ page, limit }) {
  const parsedPage = Number.parseInt(page, 10);
  if (parsedPage === -1) {
    return { unpaged: true, page: -1, limit: null, offset: null };
  }

  const safePage = Math.max(1, parsedPage || 1);
  const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 10);

  return {
    unpaged: false,
    page: safePage,
    limit: safeLimit,
    offset: (safePage - 1) * safeLimit,
  };
}

function parseIsLabour(raw) {
  if (raw === true || raw === 1 || raw === "1") {
    return true;
  }
  if (raw === false || raw === 0 || raw === "0") {
    return false;
  }
  throw new ProductValidationError("is_labour must be 0 or 1");
}

function parseProductName(raw) {
  if (raw === undefined || raw === null || String(raw).trim().length === 0) {
    throw new ProductValidationError("Product name is required");
  }
  return String(raw).trim();
}

function parsePrice(raw, label) {
  if (raw === undefined || raw === null || raw === "") {
    throw new ProductValidationError(`${label} is required`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new ProductValidationError(`${label} must be a positive number`);
  }
  return value;
}

function parseTaxCodeId(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new ProductTaxCodeRequiredError();
  }
  return String(raw).trim();
}

function expectedTaxCodeType(isLabour) {
  return isLabour ? "SAC" : "HSN";
}

function assertTaxCodeMatchesCategory(isLabour, taxCodeType) {
  if (taxCodeType !== expectedTaxCodeType(isLabour)) {
    throw new ProductTaxCodeCategoryMismatchError();
  }
}

async function resolveTaxCode(deps, taxCodeId) {
  const taxCode = await deps.getTaxCodeById(taxCodeId);
  if (!taxCode) {
    throw new ProductTaxCodeNotFoundError();
  }
  return taxCode;
}

export function formatProductRow(row, taxCode = null) {
  const type = taxCode?.type ?? row.tax_code_type ?? null;
  const code = taxCode?.code ?? row.tax_code_code ?? null;
  const description = taxCode?.description ?? row.tax_code_description ?? null;

  return {
    sr_no: row.sr_no,
    product_id: row.product_id,
    collection_id: row.collection_id,
    product_name: row.product_name,
    wholesale_price: row.wholesale_price != null ? Number(row.wholesale_price) : null,
    retail_price: row.retail_price != null ? Number(row.retail_price) : null,
    stock_in_hand: row.stock_in_hand,
    total_stock: row.total_stock,
    is_labour: Boolean(row.is_labour),
    is_delete: Boolean(row.is_delete),
    created_at: row.created_at,
    updated_at: row.updated_at,
    tax_code_id: row.tax_code_id ?? null,
    tax_code_type: row.tax_code_id ? type : null,
    tax_code_code: row.tax_code_id ? code : null,
    tax_code_description: row.tax_code_id ? description : null,
  };
}

async function formatProductWithTaxCode(deps, row) {
  if (!row?.tax_code_id) {
    return formatProductRow(row);
  }
  const taxCode = await deps.getTaxCodeById(row.tax_code_id);
  return formatProductRow(row, taxCode);
}

export async function createProduct(deps, collectionId, rawInput) {
  const productName = parseProductName(rawInput?.product_name);
  const wholesalePrice = parsePrice(rawInput?.wholesale_price, "Wholesale price");
  const retailPrice = parsePrice(rawInput?.retail_price, "Retail price");
  const isLabour = parseIsLabour(rawInput?.is_labour);
  const taxCodeId = parseTaxCodeId(rawInput?.tax_code_id);
  const taxCode = await resolveTaxCode(deps, taxCodeId);
  assertTaxCodeMatchesCategory(isLabour, taxCode.type);

  const row = await deps.insertProduct({
    collection_id: collectionId,
    product_name: productName,
    wholesale_price: wholesalePrice,
    retail_price: retailPrice,
    is_labour: isLabour,
    tax_code_id: taxCodeId,
    stock_in_hand: 0,
    total_stock: 0,
  });

  return formatProductRow(row, taxCode);
}

export async function updateProduct(deps, productId, rawInput) {
  const id = String(productId ?? "").trim();
  if (!id) {
    throw new ProductValidationError("product_id is required");
  }

  const existing = await deps.getProductById(id);
  if (!existing) {
    throw new ProductNotFoundError();
  }

  const productName = parseProductName(rawInput?.product_name);
  const wholesalePrice = parsePrice(rawInput?.wholesale_price, "Wholesale price");
  const retailPrice = parsePrice(rawInput?.retail_price, "Retail price");
  const isLabour = parseIsLabour(rawInput?.is_labour);
  const taxCodeId = parseTaxCodeId(rawInput?.tax_code_id);
  const taxCode = await resolveTaxCode(deps, taxCodeId);
  assertTaxCodeMatchesCategory(isLabour, taxCode.type);

  const row = await deps.updateProduct(id, {
    product_name: productName,
    wholesale_price: wholesalePrice,
    retail_price: retailPrice,
    is_labour: isLabour,
    tax_code_id: taxCodeId,
  });

  return formatProductRow(row, taxCode);
}

export async function getProduct(deps, productId) {
  const id = String(productId ?? "").trim();
  if (!id) {
    throw new ProductValidationError("product_id is required");
  }
  const row = await deps.getProductById(id);
  if (!row) {
    return null;
  }
  return formatProductWithTaxCode(deps, row);
}

export async function listProducts(
  deps,
  { collectionId, page, limit, search, sortField, sortOrder }
) {
  const pagination = resolveProductsListPagination({ page, limit });
  const { column, direction } = resolveProductsListOrdering({ sortField, sortOrder });

  const { rows, totalCount } = await deps.listProducts({
    collectionId,
    search,
    sortColumn: column,
    sortDirection: direction,
    unpaged: pagination.unpaged,
    limit: pagination.limit,
    offset: pagination.offset,
  });
  const products = await Promise.all(rows.map((row) => formatProductWithTaxCode(deps, row)));
  return { products, totalCount, pagination };
}
