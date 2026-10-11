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
