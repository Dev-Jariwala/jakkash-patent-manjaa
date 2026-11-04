export class BillYearValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BillYearValidationError";
    this.code = "BILL_YEAR_VALIDATION_ERROR";
    this.statusCode = 400;
  }
}

const MAX_BILL_YEAR_LENGTH = 20;

export function parseBillYear(raw) {
  if (raw === undefined || raw === null) {
    throw new BillYearValidationError("Enter a bill year");
  }
  const billYear = String(raw).trim();
  if (billYear.length === 0) {
    throw new BillYearValidationError("Enter a bill year");
  }
  if (billYear.includes("-")) {
    throw new BillYearValidationError("A bill year cannot contain a hyphen");
  }
  if (billYear.length > MAX_BILL_YEAR_LENGTH) {
    throw new BillYearValidationError("A bill year cannot be longer than 20 characters");
  }
  return billYear;
}
