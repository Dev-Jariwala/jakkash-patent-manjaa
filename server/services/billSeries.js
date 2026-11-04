import {
  BillSeriesDeleteError,
  BillSeriesDuplicateError,
  BillSeriesNotFoundError,
  BillSeriesRenameError,
  BillSeriesValidationError,
} from "./billSeriesErrors.js";

const MAX_NAME_LENGTH = 20;

function parseName(raw) {
  if (raw === undefined || raw === null) {
    throw new BillSeriesValidationError("Enter a bill series");
  }
  const name = String(raw).trim();
  if (name.length === 0) {
    throw new BillSeriesValidationError("Enter a bill series");
  }
  if (name.includes("-")) {
    throw new BillSeriesValidationError("A bill series cannot contain a hyphen");
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new BillSeriesValidationError("A bill series cannot be longer than 20 characters");
  }
  return name;
}

function parseIsActive(raw) {
  if (typeof raw !== "boolean") {
    throw new BillSeriesValidationError("Choose whether this bill series is active");
  }
  return raw;
}

export function formatBillSeriesRow(row) {
  return {
    bill_series_id: row.bill_series_id,
    name: row.name,
    is_active: Boolean(row.is_active),
  };
}

export async function listBillSeries(deps, { limit, offset }) {
  const { rows, totalCount } = await deps.listBillSeries({ limit, offset });
  return {
    billSeries: rows.map(formatBillSeriesRow),
    totalCount,
  };
}

export async function createBillSeries(deps, rawInput) {
  const name = parseName(rawInput?.name);
  const existing = await deps.getBillSeriesByName(name);
  if (existing) {
    throw new BillSeriesDuplicateError();
  }

  const row = await deps.insertBillSeries({ name });
  return formatBillSeriesRow(row);
}

export async function updateBillSeries(deps, billSeriesId, rawInput) {
  const id = String(billSeriesId ?? "").trim();
  if (!id) {
    throw new BillSeriesValidationError("Bill series id is required");
  }

  const existing = await deps.getBillSeriesById(id);
  if (!existing) {
    throw new BillSeriesNotFoundError();
  }

  if (rawInput?.name !== undefined) {
    const name = parseName(rawInput.name);
    if (name !== existing.name) {
      throw new BillSeriesRenameError();
    }
  }

  const isActive = parseIsActive(rawInput?.is_active);
  const row = await deps.updateBillSeriesActive(id, isActive);
  return formatBillSeriesRow(row);
}

export async function deleteBillSeries() {
  throw new BillSeriesDeleteError();
}
