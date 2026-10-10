export class TaxCodeValidationError extends Error {
  constructor(message, { code = "TAX_CODE_VALIDATION_ERROR" } = {}) {
    super(message);
    this.name = "TaxCodeValidationError";
    this.code = code;
    this.statusCode = 400;
  }
}

export class TaxCodeDuplicateError extends Error {
  constructor() {
    super("This code already exists for that type");
    this.name = "TaxCodeDuplicateError";
    this.code = "TAX_CODE_DUPLICATE";
    this.statusCode = 409;
  }
}

export class TaxCodeRatesMismatchError extends Error {
  constructor() {
    super("The three rates do not match");
    this.name = "TaxCodeRatesMismatchError";
    this.code = "TAX_CODE_RATES_MISMATCH";
    this.statusCode = 400;
  }
}

export class TaxCodeTypeChangeError extends Error {
  constructor() {
    super("Tax code type cannot be changed");
    this.name = "TaxCodeTypeChangeError";
    this.code = "TAX_CODE_TYPE_CHANGE";
    this.statusCode = 400;
  }
}

export class TaxCodeNotFoundError extends Error {
  constructor() {
    super("Tax code not found");
    this.name = "TaxCodeNotFoundError";
    this.code = "TAX_CODE_NOT_FOUND";
    this.statusCode = 404;
  }
}
