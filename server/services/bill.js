import { randomUUID } from "node:crypto";
import {
  BillDuplicateNumberError,
  BillNotFoundError,
  BillValidationError,
} from "./billErrors.js";

const BILL_NUMBER_PART_MAX = 20;
const RATE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PERCENT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function roundHalfUpToPaise(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function parsePercent(raw, label) {
  if (raw === undefined || raw === null || raw === "") {
    throw new BillValidationError(`${label} is required`);
  }
  const text = String(raw).trim();
  if (!PERCENT_PATTERN.test(text)) {
    throw new BillValidationError(`${label} must be zero or greater with at most two decimal places`);
  }
  return roundHalfUpToPaise(Number(text));
}

export function parseBillNumberParts(rawParts) {
  if (!Array.isArray(rawParts) || rawParts.length !== 3) {
    throw new BillValidationError("Bill number requires three parts");
  }
  const parts = rawParts.map((part, index) => {
    if (part === undefined || part === null) {
      throw new BillValidationError(`Bill number part ${index + 1} is required`);
    }
    const trimmed = String(part).trim();
    if (trimmed.length === 0) {
      throw new BillValidationError(`Bill number part ${index + 1} is required`);
    }
    if (trimmed.includes("-")) {
      throw new BillValidationError("A bill number part cannot contain a hyphen");
    }
    if (trimmed.length > BILL_NUMBER_PART_MAX) {
      throw new BillValidationError("A bill number part is too long");
    }
    return trimmed;
  });
  return { parts, billNumber: parts.join("-") };
}

export function splitBillNumber(billNumber) {
  const parts = String(billNumber).split("-");
  if (parts.length !== 3) {
    return null;
  }
  return parts;
}

function parseBillDate(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new BillValidationError("Bill date is required");
  }
  const text = String(raw).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    throw new BillValidationError("Bill date is not valid");
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BillValidationError("Bill date is not valid");
  }
  return text;
}

function parseQuantity(raw) {
  if (raw === undefined || raw === null || raw === "") {
    throw new BillValidationError("Quantity is required");
  }
  const text = String(raw).trim();
  if (!/^\d+$/.test(text)) {
    throw new BillValidationError("Quantity must be a whole number of at least 1");
  }
  const quantity = Number(text);
  if (quantity < 1) {
    throw new BillValidationError("Quantity must be a whole number of at least 1");
  }
  return quantity;
}

function parseRate(raw) {
  if (raw === undefined || raw === null || raw === "") {
    throw new BillValidationError("Rate is required");
  }
  const text = String(raw).trim();
  if (!RATE_PATTERN.test(text)) {
    throw new BillValidationError("Rate must be zero or greater with at most two decimal places");
  }
  return roundHalfUpToPaise(Number(text));
}

export function parseDiscountPercent(raw) {
  const discount = parsePercent(raw, "Discount(%)");
  if (discount < 0 || discount > 100) {
    throw new BillValidationError("Discount(%) must be from 0 to 100");
  }
  return discount;
}

export function isBlankBillLine(line) {
  const hasProduct = line?.product_id !== undefined && line?.product_id !== null && String(line.product_id).trim() !== "";
  const hasTaxCode =
    line?.tax_code_id !== undefined && line?.tax_code_id !== null && String(line.tax_code_id).trim() !== "";
  const hasQuantity =
    line?.quantity !== undefined && line?.quantity !== null && String(line.quantity).trim() !== "";
  return !hasProduct && !hasTaxCode && !hasQuantity;
}

export function isHalfFilledBillLine(line) {
  if (isBlankBillLine(line)) {
    return false;
  }
  const hasProduct = line?.product_id !== undefined && line?.product_id !== null && String(line.product_id).trim() !== "";
  const hasTaxCode =
    line?.tax_code_id !== undefined && line?.tax_code_id !== null && String(line.tax_code_id).trim() !== "";
  const hasQuantity =
    line?.quantity !== undefined && line?.quantity !== null && String(line.quantity).trim() !== "";
  return !(hasProduct && hasTaxCode && hasQuantity);
}

function isMissingLineRate(line) {
  if (line?.rate === undefined || line?.rate === null) {
    return true;
  }
  return String(line.rate).trim() === "";
}

export function validateTaxPercentShape(cgstPercent, sgstPercent, igstPercent) {
  const cgst = roundHalfUpToPaise(cgstPercent);
  const sgst = roundHalfUpToPaise(sgstPercent);
  const igst = roundHalfUpToPaise(igstPercent);
  if (cgst < 0 || sgst < 0 || igst < 0) {
    throw new BillValidationError("Tax percents must be zero or greater with at most two decimal places");
  }
  const withinState = cgst === sgst && igst === 0;
  const igstOnly = cgst === 0 && sgst === 0;
  if (!withinState && !igstOnly) {
    throw new BillValidationError(
      "Tax percents must be equal CGST and SGST with IGST 0, or CGST and SGST both 0 with IGST only"
    );
  }
  return { cgst, sgst, igst };
}

export function computeLineFinancials({
  quantity,
  rate,
  discountPercent,
  cgstPercent,
  sgstPercent,
  igstPercent,
}) {
  const price = roundHalfUpToPaise(quantity * rate);
  const discountedPrice = roundHalfUpToPaise(price * (1 - discountPercent / 100));
  const { cgst, sgst, igst } = validateTaxPercentShape(cgstPercent, sgstPercent, igstPercent);
  const cgstAmount = roundHalfUpToPaise((discountedPrice * cgst) / 100);
  const sgstAmount = roundHalfUpToPaise((discountedPrice * sgst) / 100);
  const igstAmount = roundHalfUpToPaise((discountedPrice * igst) / 100);
  const lineTotal = roundHalfUpToPaise(
    discountedPrice + cgstAmount + sgstAmount + igstAmount
  );
  return {
    price,
    discounted_price: discountedPrice,
    cgst_percent: cgst,
    sgst_percent: sgst,
    igst_percent: igst,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    line_total: lineTotal,
  };
}

export function computeBillTotalsFromLines(lines, discountPercent) {
  const discount = parseDiscountPercent(discountPercent);
  let totalValue = 0;
  let totalTax = 0;
  const computedLines = lines.map((line) => {
    const financials = computeLineFinancials({
      quantity: line.quantity,
      rate: line.rate,
      discountPercent: discount,
      cgstPercent: line.cgst_percent,
      sgstPercent: line.sgst_percent,
      igstPercent: line.igst_percent,
    });
    totalValue = roundHalfUpToPaise(totalValue + financials.discounted_price);
    totalTax = roundHalfUpToPaise(
      totalTax + financials.cgst_amount + financials.sgst_amount + financials.igst_amount
    );
    return { ...line, ...financials };
  });
  const totalBill = roundHalfUpToPaise(totalValue + totalTax);
  return {
    discount_percent: discount,
    total_value: totalValue,
    total_tax: totalTax,
    total_bill: totalBill,
    lines: computedLines,
  };
}

export function previewBillTotals(input) {
  const discountPercent = parseDiscountPercent(input?.discount_percent ?? 0);
  const kept = [];
  const linePreviews = [];
  for (const line of input?.lines ?? []) {
    if (isBlankBillLine(line)) {
      linePreviews.push(null);
      continue;
    }
    if (isHalfFilledBillLine(line)) {
      linePreviews.push(null);
      continue;
    }
    if (isMissingLineRate(line)) {
      linePreviews.push(null);
      continue;
    }
    const quantity = parseQuantity(line.quantity);
    const rate = parseRate(line.rate);
    validateTaxPercentShape(
      line.cgst_percent ?? 0,
      line.sgst_percent ?? 0,
      line.igst_percent ?? 0
    );
    const financials = computeLineFinancials({
      quantity,
      rate,
      discountPercent,
      cgstPercent: line.cgst_percent ?? 0,
      sgstPercent: line.sgst_percent ?? 0,
      igstPercent: line.igst_percent ?? 0,
    });
    linePreviews.push(financials);
    kept.push({
      quantity,
      rate,
      cgst_percent: line.cgst_percent ?? 0,
      sgst_percent: line.sgst_percent ?? 0,
      igst_percent: line.igst_percent ?? 0,
    });
  }
  if (kept.length === 0) {
    return {
      discount_percent: discountPercent,
      total_value: 0,
      total_tax: 0,
      total_bill: 0,
      line_previews: linePreviews,
    };
  }
  const totals = computeBillTotalsFromLines(kept, discountPercent);
  return { ...totals, line_previews: linePreviews };
}

function formatBillLineRow(row) {
  return {
    bill_line_id: row.bill_line_id,
    product_id: row.product_id,
    product_name: row.product_name,
    tax_code_id: row.tax_code_id,
    tax_code: row.tax_code,
    tax_code_description: row.tax_code_description,
    quantity: row.quantity,
    rate: Number(row.rate),
    price: Number(row.price),
    cgst_percent: Number(row.cgst_percent),
    sgst_percent: Number(row.sgst_percent),
    igst_percent: Number(row.igst_percent),
    cgst_amount: Number(row.cgst_amount),
    sgst_amount: Number(row.sgst_amount),
    igst_amount: Number(row.igst_amount),
    discounted_price: Number(row.discounted_price),
    line_total: Number(row.line_total),
  };
}

function formatBillRow(row, lines) {
  return {
    bill_id: row.bill_id,
    collection_id: row.collection_id,
    bill_number: row.bill_number,
    bill_number_parts: splitBillNumber(row.bill_number),
    bill_date: row.bill_date,
    receiver_mobile: row.receiver_mobile,
    receiver_name: row.receiver_name,
    receiver_address: row.receiver_address,
    receiver_gst_number: row.receiver_gst_number,
    receiver_contact_person: row.receiver_contact_person,
    receiver_contact_number: row.receiver_contact_number,
    discount_percent: Number(row.discount_percent),
    total_value: Number(row.total_value),
    total_tax: Number(row.total_tax),
    total_bill: Number(row.total_bill),
    bank_name: row.bank_name,
    bank_address: row.bank_address,
    bank_account_number: row.bank_account_number,
    bank_ifsc: row.bank_ifsc,
    saved_at: row.saved_at,
    lines: lines.map(formatBillLineRow),
  };
}

function formatBillListRow(row) {
  return {
    bill_id: row.bill_id,
    bill_number: row.bill_number,
    bill_date: row.bill_date,
    receiver_name: row.receiver_name,
    total_bill: Number(row.total_bill),
    saved_at: row.saved_at,
  };
}

export async function listBills(deps, collectionId) {
  const rows = await deps.listBillsByCollection(collectionId);
  return rows.map(formatBillListRow);
}

export async function getBill(deps, collectionId, billId) {
  const row = await deps.getBillById(billId);
  if (!row || row.collection_id !== collectionId) {
    throw new BillNotFoundError();
  }
  const lines = await deps.listBillLines(billId);
  return formatBillRow(row, lines);
}

async function resolveReceiver(deps, receiverMobile) {
  if (!receiverMobile || String(receiverMobile).trim() === "") {
    throw new BillValidationError("Receiver is required");
  }
  const mobile = String(receiverMobile).trim();
  const client = await deps.getClientByMobile(mobile);
  if (!client) {
    throw new BillValidationError("Receiver is not a known client");
  }
  const gst = client.gst_number ? String(client.gst_number).trim() : "";
  if (!gst) {
    throw new BillValidationError("Receiver must be a client with a GST number");
  }
  return {
    receiver_mobile: mobile,
    receiver_name: client.name,
    receiver_address: client.address,
    receiver_gst_number: gst,
    receiver_contact_person: client.contact_person ?? null,
    receiver_contact_number: client.contact_number ?? null,
  };
}

async function resolveKeptLines(deps, collectionId, rawLines, discountPercent) {
  const keptInputs = [];
  for (const line of rawLines ?? []) {
    if (isBlankBillLine(line)) {
      continue;
    }
    if (isHalfFilledBillLine(line)) {
      throw new BillValidationError("Each line needs a product, a tax code, and a quantity");
    }
    const productId = String(line.product_id).trim();
    const taxCodeId = String(line.tax_code_id).trim();
    const product = await deps.getProductById(productId);
    if (!product) {
      throw new BillValidationError("Product is not known");
    }
    if (product.collection_id !== collectionId) {
      throw new BillValidationError("Product must belong to this collection");
    }
    const taxCode = await deps.getTaxCodeById(taxCodeId);
    if (!taxCode) {
      throw new BillValidationError("Tax code is not known");
    }
    const quantity = parseQuantity(line.quantity);
    const rate = parseRate(line.rate);
    const percents = validateTaxPercentShape(
      line.cgst_percent ?? 0,
      line.sgst_percent ?? 0,
      line.igst_percent ?? 0
    );
    const financials = computeLineFinancials({
      quantity,
      rate,
      discountPercent,
      cgstPercent: percents.cgst,
      sgstPercent: percents.sgst,
      igstPercent: percents.igst,
    });
    keptInputs.push({
      product_id: productId,
      product_name: product.product_name,
      tax_code_id: taxCodeId,
      tax_code: taxCode.code,
      tax_code_description: taxCode.description,
      quantity,
      rate,
      ...financials,
    });
  }
  if (keptInputs.length === 0) {
    throw new BillValidationError("A bill needs at least one line");
  }
  return keptInputs;
}

async function copyShopBankBlock(deps) {
  const account = await deps.getShopBankAccount();
  if (!account) {
    throw new BillValidationError("Save Bank details first");
  }
  return {
    bank_name: account.bank_name,
    bank_address: account.bank_address,
    bank_account_number: account.account_number,
    bank_ifsc: account.ifsc,
  };
}

async function assertBillNumberAvailable(deps, billNumber, excludeBillId = null) {
  const existing = await deps.getBillByBillNumber(billNumber);
  if (existing && existing.bill_id !== excludeBillId) {
    throw new BillDuplicateNumberError();
  }
}

export async function createBill(deps, collectionId, rawInput) {
  const { billNumber } = parseBillNumberParts(rawInput?.bill_number_parts);
  const billDate = parseBillDate(rawInput?.bill_date);
  const discountPercent = parseDiscountPercent(rawInput?.discount_percent ?? 0);
  await assertBillNumberAvailable(deps, billNumber);
  const receiver = await resolveReceiver(deps, rawInput?.receiver_mobile);
  const bank = await copyShopBankBlock(deps);
  const keptLines = await resolveKeptLines(
    deps,
    collectionId,
    rawInput?.lines,
    discountPercent
  );

  let totalValue = 0;
  let totalTax = 0;
  for (const line of keptLines) {
    totalValue = roundHalfUpToPaise(totalValue + line.discounted_price);
    totalTax = roundHalfUpToPaise(
      totalTax + line.cgst_amount + line.sgst_amount + line.igst_amount
    );
  }
  const totalBill = roundHalfUpToPaise(totalValue + totalTax);

  const billId = randomUUID();
  const savedAt = new Date().toISOString();
  const billRow = {
    bill_id: billId,
    collection_id: collectionId,
    bill_number: billNumber,
    bill_date: billDate,
    ...receiver,
    discount_percent: discountPercent,
    total_value: totalValue,
    total_tax: totalTax,
    total_bill: totalBill,
    ...bank,
    saved_at: savedAt,
  };

  await deps.insertBill(
    billRow,
    keptLines.map((line, index) => ({
      bill_line_id: randomUUID(),
      bill_id: billId,
      line_order: index,
      ...line,
    }))
  );

  if (deps.noteBillSaved) {
    await deps.noteBillSaved();
  }

  const lines = await deps.listBillLines(billId);
  return formatBillRow(billRow, lines);
}

export async function updateBill(deps, collectionId, billId, rawInput) {
  const existing = await deps.getBillById(billId);
  if (!existing || existing.collection_id !== collectionId) {
    throw new BillNotFoundError();
  }
  const { billNumber } = parseBillNumberParts(rawInput?.bill_number_parts);
  const billDate = parseBillDate(rawInput?.bill_date);
  const discountPercent = parseDiscountPercent(rawInput?.discount_percent ?? 0);
  await assertBillNumberAvailable(deps, billNumber, billId);

  const receiverMobile = rawInput?.receiver_mobile ?? existing.receiver_mobile;
  let receiver;
  if (String(receiverMobile) === String(existing.receiver_mobile)) {
    receiver = {
      receiver_mobile: existing.receiver_mobile,
      receiver_name: existing.receiver_name,
      receiver_address: existing.receiver_address,
      receiver_gst_number: existing.receiver_gst_number,
      receiver_contact_person: existing.receiver_contact_person,
      receiver_contact_number: existing.receiver_contact_number,
    };
  } else {
    receiver = await resolveReceiver(deps, receiverMobile);
  }

  const keptLines = await resolveKeptLinesForUpdate(
    deps,
    collectionId,
    billId,
    rawInput?.lines,
    discountPercent
  );

  let totalValue = 0;
  let totalTax = 0;
  for (const line of keptLines) {
    totalValue = roundHalfUpToPaise(totalValue + line.discounted_price);
    totalTax = roundHalfUpToPaise(
      totalTax + line.cgst_amount + line.sgst_amount + line.igst_amount
    );
  }
  const totalBill = roundHalfUpToPaise(totalValue + totalTax);

  const savedAt = new Date().toISOString();
  const billRow = {
    ...existing,
    bill_number: billNumber,
    bill_date: billDate,
    ...receiver,
    discount_percent: discountPercent,
    total_value: totalValue,
    total_tax: totalTax,
    total_bill: totalBill,
    saved_at: savedAt,
  };

  await deps.replaceBillLines(
    billId,
    keptLines.map((line, index) => ({
      ...line,
      bill_id: billId,
      line_order: index,
    })),
    billRow
  );

  const lines = await deps.listBillLines(billId);
  return formatBillRow(billRow, lines);
}

async function resolveKeptLinesForUpdate(deps, collectionId, billId, rawLines, discountPercent) {
  const existingLines = await deps.listBillLines(billId);
  const existingByLineId = new Map(existingLines.map((line) => [line.bill_line_id, line]));
  const keptInputs = [];

  for (const line of rawLines ?? []) {
    if (isBlankBillLine(line)) {
      continue;
    }
    if (isHalfFilledBillLine(line)) {
      throw new BillValidationError("Each line needs a product, a tax code, and a quantity");
    }
    const lineId = line.bill_line_id ? String(line.bill_line_id).trim() : null;
    if (lineId && !existingByLineId.has(lineId)) {
      throw new BillValidationError("Bill line does not belong to this bill");
    }

    const productId = String(line.product_id).trim();
    const taxCodeId = String(line.tax_code_id).trim();
    const product = await deps.getProductById(productId);
    if (!product) {
      throw new BillValidationError("Product is not known");
    }
    if (product.collection_id !== collectionId) {
      throw new BillValidationError("Product must belong to this collection");
    }
    const taxCode = await deps.getTaxCodeById(taxCodeId);
    if (!taxCode) {
      throw new BillValidationError("Tax code is not known");
    }
    const quantity = parseQuantity(line.quantity);
    const rate = parseRate(line.rate);
    const percents = validateTaxPercentShape(
      line.cgst_percent ?? 0,
      line.sgst_percent ?? 0,
      line.igst_percent ?? 0
    );

    const existingLine = lineId ? existingByLineId.get(lineId) : null;
    const productName =
      existingLine && existingLine.product_id === productId
        ? existingLine.product_name
        : product.product_name;
    const taxCodeValue =
      existingLine && existingLine.tax_code_id === taxCodeId
        ? existingLine.tax_code
        : taxCode.code;
    const taxCodeDescription =
      existingLine && existingLine.tax_code_id === taxCodeId
        ? existingLine.tax_code_description
        : taxCode.description;

    const financials = computeLineFinancials({
      quantity,
      rate,
      discountPercent,
      cgstPercent: percents.cgst,
      sgstPercent: percents.sgst,
      igstPercent: percents.igst,
    });

    keptInputs.push({
      bill_line_id: lineId ?? randomUUID(),
      product_id: productId,
      product_name: productName,
      tax_code_id: taxCodeId,
      tax_code: taxCodeValue,
      tax_code_description: taxCodeDescription,
      quantity,
      rate,
      ...financials,
    });
  }

  if (keptInputs.length === 0) {
    throw new BillValidationError("A bill needs at least one line");
  }
  return keptInputs;
}
