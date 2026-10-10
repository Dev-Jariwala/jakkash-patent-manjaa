import { ShopBankAccountValidationError } from "./shopBankAccountErrors.js";

const BANK_NAME_MAX = 120;
const BANK_ADDRESS_MAX = 255;
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;

function requireTrimmedField(raw, fieldLabel) {
  if (raw === undefined || raw === null) {
    throw new ShopBankAccountValidationError(`${fieldLabel} is required`);
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    throw new ShopBankAccountValidationError(`${fieldLabel} is required`);
  }
  return trimmed;
}

function parseBankName(raw) {
  const bankName = requireTrimmedField(raw, "Bank name");
  if (bankName.length > BANK_NAME_MAX) {
    throw new ShopBankAccountValidationError("Bank name is too long");
  }
  return bankName;
}

function parseBankAddress(raw) {
  const bankAddress = requireTrimmedField(raw, "Bank address");
  if (bankAddress.length > BANK_ADDRESS_MAX) {
    throw new ShopBankAccountValidationError("Bank address is too long");
  }
  return bankAddress;
}

function parseAccountNumber(raw) {
  if (raw === undefined || raw === null) {
    throw new ShopBankAccountValidationError("Account number is required");
  }
  const accountNumber = String(raw).trim();
  if (accountNumber.length === 0) {
    throw new ShopBankAccountValidationError("Account number is required");
  }
  if (!/^\d{9,18}$/.test(accountNumber)) {
    throw new ShopBankAccountValidationError("Account number must be 9 to 18 digits");
  }
  return accountNumber;
}

function parseIfsc(raw) {
  if (raw === undefined || raw === null) {
    throw new ShopBankAccountValidationError("IFSC is required");
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    throw new ShopBankAccountValidationError("IFSC is required");
  }
  if (/\s/.test(trimmed)) {
    throw new ShopBankAccountValidationError(
      "IFSC must be the standard 11-character IFSC"
    );
  }
  const ifsc = trimmed.toUpperCase();
  if (!IFSC_PATTERN.test(ifsc)) {
    throw new ShopBankAccountValidationError(
      "IFSC must be the standard 11-character IFSC"
    );
  }
  return ifsc;
}

export function formatShopBankAccountRow(row) {
  return {
    bank_name: row.bank_name,
    bank_address: row.bank_address,
    account_number: row.account_number,
    ifsc: row.ifsc,
    updated_at: row.updated_at,
  };
}

export async function getShopBankAccount(deps) {
  const row = await deps.getShopBankAccount();
  if (!row) {
    return null;
  }
  return formatShopBankAccountRow(row);
}

export async function saveShopBankAccount(deps, rawInput) {
  const bankName = parseBankName(rawInput?.bank_name);
  const bankAddress = parseBankAddress(rawInput?.bank_address);
  const accountNumber = parseAccountNumber(rawInput?.account_number);
  const ifsc = parseIfsc(rawInput?.ifsc);
  const updatedAt = new Date().toISOString();

  const existing = await deps.getShopBankAccount();
  const payload = {
    bank_name: bankName,
    bank_address: bankAddress,
    account_number: accountNumber,
    ifsc,
    updated_at: updatedAt,
  };

  const row = existing
    ? await deps.updateShopBankAccount(payload)
    : await deps.insertShopBankAccount(payload);

  if (!row) {
    throw new ShopBankAccountValidationError("Shop bank account could not be saved");
  }

  return formatShopBankAccountRow(row);
}
