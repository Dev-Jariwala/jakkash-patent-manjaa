export class ProductValidationError extends Error {
  constructor(message, { code = "PRODUCT_VALIDATION_ERROR" } = {}) {
    super(message);
    this.name = "ProductValidationError";
    this.code = code;
    this.statusCode = 400;
  }
}

export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ProductNotFoundError";
    this.code = "PRODUCT_NOT_FOUND";
    this.statusCode = 404;
  }
}

export class ProductTaxCodeNotFoundError extends Error {
  constructor() {
    super("Tax code not found");
    this.name = "ProductTaxCodeNotFoundError";
    this.code = "PRODUCT_TAX_CODE_NOT_FOUND";
    this.statusCode = 400;
  }
}

export class ProductTaxCodeCategoryMismatchError extends Error {
  constructor() {
    super("A product must use an HSN or labour must use a SAC");
    this.name = "ProductTaxCodeCategoryMismatchError";
    this.code = "PRODUCT_TAX_CODE_CATEGORY_MISMATCH";
    this.statusCode = 400;
  }
}

export const PRODUCT_INACTIVE_MESSAGE = "This product is inactive";

export class ProductInactiveError extends Error {
  constructor() {
    super(PRODUCT_INACTIVE_MESSAGE);
    this.name = "ProductInactiveError";
    this.code = "PRODUCT_INACTIVE";
    this.statusCode = 400;
  }
}

export const PRODUCT_DISPLAY_ORDER_REORDER_MESSAGE =
  "Product display order must list every product in the collection, each once";

export class ProductDisplayOrderReorderError extends Error {
  constructor(message = PRODUCT_DISPLAY_ORDER_REORDER_MESSAGE) {
    super(message);
    this.name = "ProductDisplayOrderReorderError";
    this.code = "PRODUCT_DISPLAY_ORDER_REORDER";
    this.statusCode = 400;
  }
}
