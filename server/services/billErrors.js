export class BillValidationError extends Error {
  constructor(message, { code = "BILL_VALIDATION_ERROR" } = {}) {
    super(message);
    this.name = "BillValidationError";
    this.code = code;
    this.statusCode = 400;
  }
}

export class BillDuplicateNumberError extends Error {
  constructor() {
    super("This bill number is already in use");
    this.name = "BillDuplicateNumberError";
    this.code = "BILL_DUPLICATE_NUMBER";
    this.statusCode = 409;
  }
}

export class BillNotFoundError extends Error {
  constructor() {
    super("Bill not found");
    this.name = "BillNotFoundError";
    this.code = "BILL_NOT_FOUND";
    this.statusCode = 404;
  }
}

export class BillInsufficientStockError extends Error {
  constructor(productName, available, requested) {
    super(
      `${productName}: only ${available} in stock, but ${requested} requested`
    );
    this.name = "BillInsufficientStockError";
    this.code = "BILL_INSUFFICIENT_STOCK";
    this.statusCode = 400;
    this.productName = productName;
    this.available = available;
    this.requested = requested;
  }
}

export function formatBillRateForMessage(rate) {
  const n = Number(rate);
  if (!Number.isFinite(n)) {
    return String(rate);
  }
  const rounded = Math.round((n + Number.EPSILON) * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < Number.EPSILON) {
    return String(Math.round(rounded));
  }
  return String(rounded);
}

export class BillDuplicateProductError extends Error {
  constructor(productName, rate) {
    const rateText = formatBillRateForMessage(rate);
    super(`${productName} is already on this bill at ${rateText}.`);
    this.name = "BillDuplicateProductError";
    this.code = "BILL_DUPLICATE_PRODUCT";
    this.statusCode = 400;
    this.productName = productName;
    this.rate = rate;
  }
}
