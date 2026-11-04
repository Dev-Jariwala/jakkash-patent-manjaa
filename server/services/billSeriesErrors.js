export class BillSeriesValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BillSeriesValidationError";
    this.code = "BILL_SERIES_VALIDATION_ERROR";
    this.statusCode = 400;
  }
}

export class BillSeriesDuplicateError extends Error {
  constructor() {
    super("This bill series already exists");
    this.name = "BillSeriesDuplicateError";
    this.code = "BILL_SERIES_DUPLICATE";
    this.statusCode = 409;
  }
}

export class BillSeriesRenameError extends Error {
  constructor() {
    super("A bill series cannot be renamed");
    this.name = "BillSeriesRenameError";
    this.code = "BILL_SERIES_RENAME";
    this.statusCode = 400;
  }
}

export class BillSeriesDeleteError extends Error {
  constructor() {
    super("A bill series cannot be deleted");
    this.name = "BillSeriesDeleteError";
    this.code = "BILL_SERIES_DELETE";
    this.statusCode = 400;
  }
}

export class BillSeriesNotFoundError extends Error {
  constructor() {
    super("Bill series not found");
    this.name = "BillSeriesNotFoundError";
    this.code = "BILL_SERIES_NOT_FOUND";
    this.statusCode = 404;
  }
}
