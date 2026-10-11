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

export class ProductTaxCodeRequiredError extends Error {
  constructor() {
    super("HSN/SAC is required");
    this.name = "ProductTaxCodeRequiredError";
    this.code = "PRODUCT_TAX_CODE_REQUIRED";
    this.statusCode = 400;
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
