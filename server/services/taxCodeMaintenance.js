import {
  TaxCodeDuplicateError,
  TaxCodeNotFoundError,
  TaxCodeRatesMismatchError,
  TaxCodeTypeChangeError,
  TaxCodeValidationError,
} from "./taxCodeMaintenanceErrors.js";

const HSN_LENGTHS = new Set([4, 6, 8]);
const SAC_LENGTH = 6;
const RATE_PATTERN = /^\d+(\.\d{1,2})?$/;

function requireDescription(raw) {
  if (raw === undefined || raw === null) {
    throw new TaxCodeValidationError("Description is required");
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    throw new TaxCodeValidationError("Description is required");
  }
  if (trimmed.length > 255) {
    throw new TaxCodeValidationError("Description is too long");
  }
  return trimmed;
}

function parseType(raw) {
  const type = String(raw ?? "").trim().toUpperCase();
  if (type !== "HSN" && type !== "SAC") {
    throw new TaxCodeValidationError("Type must be HSN or SAC");
  }
  return type;
}

function parseCode(raw) {
  if (raw === undefined || raw === null) {
    throw new TaxCodeValidationError("Code is required");
  }
  const code = String(raw).trim();
  if (code.length === 0) {
    throw new TaxCodeValidationError("Code is required");
  }
  if (!/^\d+$/.test(code)) {
    throw new TaxCodeValidationError("Code must contain digits only");
  }
  return code;
}

function assertCodeLengthForType(type, code) {
  if (type === "HSN") {
    if (!HSN_LENGTHS.has(code.length)) {
      throw new TaxCodeValidationError("HSN code must be 4, 6, or 8 digits");
    }
    return;
  }
  if (code.length !== SAC_LENGTH) {
    throw new TaxCodeValidationError("SAC code must be 6 digits");
  }
}

function parseRate(raw, fieldLabel) {
  if (raw === undefined || raw === null || raw === "") {
    throw new TaxCodeValidationError(`${fieldLabel} is required`);
  }
  const text = String(raw).trim();
  if (!RATE_PATTERN.test(text)) {
    if (text.startsWith("-")) {
      throw new TaxCodeValidationError(`${fieldLabel} cannot be negative`);
    }
    throw new TaxCodeValidationError(
      `${fieldLabel} must be zero or greater with at most two decimal places`
    );
  }
  const value = Number(text);
  if (value < 0) {
    throw new TaxCodeValidationError(`${fieldLabel} cannot be negative`);
  }
  return value;
}

function parseRates(raw) {
  const cgst = parseRate(raw?.cgst, "CGST");
  const sgst = parseRate(raw?.sgst, "SGST");
  const igst = parseRate(raw?.igst, "IGST");
  return { cgst, sgst, igst };
}

function assertRatesMatch({ cgst, sgst, igst }) {
  if (cgst !== sgst || igst !== cgst + sgst) {
    throw new TaxCodeRatesMismatchError();
  }
}

export function formatTaxCodeRow(row) {
  return {
    tax_code_id: row.tax_code_id,
    type: row.type,
    code: row.code,
    description: row.description,
    cgst: Number(row.cgst),
    sgst: Number(row.sgst),
    igst: Number(row.igst),
  };
}

export async function listTaxCodes(deps, { limit, offset }) {
  const { rows, totalCount } = await deps.listTaxCodes({ limit, offset });
  return {
    taxCodes: rows.map(formatTaxCodeRow),
    totalCount,
  };
}

export async function createTaxCode(deps, rawInput) {
  const type = parseType(rawInput?.type);
  const code = parseCode(rawInput?.code);
  assertCodeLengthForType(type, code);
  const description = requireDescription(rawInput?.description);
  const rates = parseRates(rawInput);
  assertRatesMatch(rates);

  const existing = await deps.getTaxCodeByTypeAndCode(type, code);
  if (existing) {
    throw new TaxCodeDuplicateError();
  }

  const row = await deps.insertTaxCode({
    type,
    code,
    description,
    cgst: rates.cgst,
    sgst: rates.sgst,
    igst: rates.igst,
  });

  return formatTaxCodeRow(row);
}

export async function updateTaxCode(deps, taxCodeId, rawInput) {
  const id = String(taxCodeId ?? "").trim();
  if (!id) {
    throw new TaxCodeValidationError("Tax code id is required");
  }

  const existing = await deps.getTaxCodeById(id);
  if (!existing) {
    throw new TaxCodeNotFoundError();
  }

  if (rawInput?.type !== undefined && parseType(rawInput.type) !== existing.type) {
    throw new TaxCodeTypeChangeError();
  }

  const code = parseCode(rawInput?.code);
  assertCodeLengthForType(existing.type, code);
  const description = requireDescription(rawInput?.description);
  const rates = parseRates(rawInput);
  assertRatesMatch(rates);

  const duplicate = await deps.getTaxCodeByTypeAndCode(existing.type, code);
  if (duplicate && duplicate.tax_code_id !== id) {
    throw new TaxCodeDuplicateError();
  }

  const row = await deps.updateTaxCode(id, {
    code,
    description,
    cgst: rates.cgst,
    sgst: rates.sgst,
    igst: rates.igst,
  });

  return formatTaxCodeRow(row);
}
