import { randomUUID } from "node:crypto";
import { normalizeBillCalendarDate } from "../utils/billCalendarDate.js";
import {
  BillDuplicateNumberError,
  BillNotFoundError,
  BillValidationError,
} from "./billErrors.js";

const BILL_NUMBER_PART_MAX = 20;
const RATE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PERCENT_PATTERN = /^\d+(\.\d{1,2})?$/;

export const TAX_SHAPE_WITHIN_STATE = "within-state";
export const TAX_SHAPE_INTERSTATE = "interstate";

export function roundHalfUpToPaise(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round((n + Number.EPSILON) * 100) / 100;
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

export function rejectDiscountInPayload(rawInput) {
  if (
    rawInput !== null &&
    rawInput !== undefined &&
    Object.prototype.hasOwnProperty.call(rawInput, "discount_percent")
  ) {
    throw new BillValidationError("A Bill has no Discount(%)");
  }
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

function parseTaxPercentValue(raw) {
  if (raw === undefined || raw === null || raw === "") {
    throw new BillValidationError("Tax percents must be zero or greater with at most two decimal places");
  }
  const text = String(raw).trim();
  if (!PERCENT_PATTERN.test(text)) {
    throw new BillValidationError("Tax percents must be zero or greater with at most two decimal places");
  }
  const value = roundHalfUpToPaise(Number(text));
  if (value < 0) {
    throw new BillValidationError("Tax percents must be zero or greater with at most two decimal places");
  }
  return value;
}

export function parseTaxShape(raw, { required = true } = {}) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    if (!required) {
      return null;
    }
    throw new BillValidationError("Tax shape is required");
  }
  const text = String(raw).trim();
  if (text !== TAX_SHAPE_WITHIN_STATE && text !== TAX_SHAPE_INTERSTATE) {
    throw new BillValidationError("Tax shape is not valid");
  }
  return text;
}

export function validateTaxPercentShape(cgstPercent, sgstPercent, igstPercent) {
  const cgst = parseTaxPercentValue(cgstPercent);
  const sgst = parseTaxPercentValue(sgstPercent);
  const igst = parseTaxPercentValue(igstPercent);
  const withinState = cgst === sgst && igst === 0;
  const igstOnly = cgst === 0 && sgst === 0;
  if (!withinState && !igstOnly) {
    throw new BillValidationError(
      "Tax percents must be equal CGST and SGST with IGST 0, or CGST and SGST both 0 with IGST only"
    );
  }
  return { cgst, sgst, igst };
}

export function validateTaxCopyTrio(cgstPercent, sgstPercent, igstPercent) {
  const cgst = parseTaxPercentValue(cgstPercent);
  const sgst = parseTaxPercentValue(sgstPercent);
  const igst = parseTaxPercentValue(igstPercent);
  if (cgst !== sgst) {
    throw new BillValidationError("CGST and SGST on the copied rates must be equal");
  }
  if (igst !== roundHalfUpToPaise(cgst + sgst)) {
    throw new BillValidationError("IGST on the copied rates must equal CGST plus SGST");
  }
  return { cgst, sgst, igst };
}

export const LEGACY_BILL_SHAPE_MIXED = "mixed";

export function isExemptChargedPercents(cgstPercent, sgstPercent, igstPercent) {
  const cgst = parseTaxPercentValue(cgstPercent);
  const sgst = parseTaxPercentValue(sgstPercent);
  const igst = parseTaxPercentValue(igstPercent);
  return cgst === 0 && sgst === 0 && igst === 0;
}

export function chargedShapeFromLegacyPercents(cgstPercent, sgstPercent, igstPercent) {
  if (isExemptChargedPercents(cgstPercent, sgstPercent, igstPercent)) {
    return "exempt";
  }
  const cgst = parseTaxPercentValue(cgstPercent);
  const sgst = parseTaxPercentValue(sgstPercent);
  const igst = parseTaxPercentValue(igstPercent);
  if (cgst === sgst && igst === 0) {
    return TAX_SHAPE_WITHIN_STATE;
  }
  if (cgst === 0 && sgst === 0 && igst > 0) {
    return TAX_SHAPE_INTERSTATE;
  }
  throw new BillValidationError(
    "Tax percents must be equal CGST and SGST with IGST 0, or CGST and SGST both 0 with IGST only"
  );
}

function chargedShapeFromLineAmounts(line) {
  const cgstAmount = Number(line.cgst_amount) || 0;
  const sgstAmount = Number(line.sgst_amount) || 0;
  const igstAmount = Number(line.igst_amount) || 0;
  if (cgstAmount > 0 || sgstAmount > 0) {
    return TAX_SHAPE_WITHIN_STATE;
  }
  if (igstAmount > 0) {
    return TAX_SHAPE_INTERSTATE;
  }
  return "exempt";
}

function lineHasStoredTaxAmounts(line) {
  return (
    line.cgst_amount !== undefined &&
    line.cgst_amount !== null &&
    line.sgst_amount !== undefined &&
    line.sgst_amount !== null &&
    line.igst_amount !== undefined &&
    line.igst_amount !== null
  );
}

export function inferLegacyBillSharedShape(lines, rememberedSharedShape = null) {
  if (!lines || lines.length === 0) {
    return null;
  }
  const nonExemptShapes = [];
  let skippedCopyWithoutAmounts = 0;
  for (const line of lines) {
    let shape;
    try {
      if (line.tax_rates_are_copy) {
        if (lineHasStoredTaxAmounts(line)) {
          shape = chargedShapeFromLineAmounts(line);
        } else {
          skippedCopyWithoutAmounts += 1;
          continue;
        }
      } else {
        shape = chargedShapeFromLegacyPercents(
          line.cgst_percent ?? 0,
          line.sgst_percent ?? 0,
          line.igst_percent ?? 0
        );
      }
    } catch {
      return LEGACY_BILL_SHAPE_MIXED;
    }
    if (shape !== "exempt") {
      nonExemptShapes.push(shape);
    }
  }
  if (nonExemptShapes.length === 0) {
    const everyLineIsCopyWithoutAmounts =
      lines.length > 0 && skippedCopyWithoutAmounts === lines.length;
    if (everyLineIsCopyWithoutAmounts && rememberedSharedShape) {
      return rememberedSharedShape;
    }
    return TAX_SHAPE_WITHIN_STATE;
  }
  const first = nonExemptShapes[0];
  if (nonExemptShapes.some((s) => s !== first)) {
    return LEGACY_BILL_SHAPE_MIXED;
  }
  return first;
}

function inferLegacySharedShapeForKeptPayload(existingByLineId, rawLines) {
  const existingKept = [];
  const syntheticKept = [];
  for (const line of rawLines ?? []) {
    if (isBlankBillLine(line)) {
      continue;
    }
    const lineId = line.bill_line_id ? String(line.bill_line_id).trim() : null;
    const existingLine = lineId ? existingByLineId.get(lineId) : null;
    if (existingLine) {
      existingKept.push(existingLine);
      continue;
    }
    syntheticKept.push({
      tax_rates_are_copy: isTruthyFlag(line.tax_rates_are_copy),
      cgst_percent: line.cgst_percent ?? 0,
      sgst_percent: line.sgst_percent ?? 0,
      igst_percent: line.igst_percent ?? 0,
      ...(lineHasStoredTaxAmounts(line)
        ? {
            cgst_amount: line.cgst_amount,
            sgst_amount: line.sgst_amount,
            igst_amount: line.igst_amount,
          }
        : {}),
    });
  }
  if (existingKept.length === 0) {
    return inferLegacyBillSharedShape(syntheticKept);
  }
  return inferLegacyBillSharedShape(existingKept);
}

function chargedPercentsMatchStored(percents, storedLine) {
  const stored = validateTaxPercentShape(
    storedLine.cgst_percent,
    storedLine.sgst_percent,
    storedLine.igst_percent
  );
  return (
    percents.cgst === stored.cgst &&
    percents.sgst === stored.sgst &&
    percents.igst === stored.igst
  );
}

function chargedPercentsFromTaxCodeForLineShape(taxCode, lineShape) {
  if (lineShape === TAX_SHAPE_INTERSTATE) {
    return { cgst: 0, sgst: 0, igst: taxCode.igst };
  }
  return {
    cgst: taxCode.cgst,
    sgst: taxCode.sgst,
    igst: 0,
  };
}

function hasTaxShapeInPayload(rawTaxShape) {
  return (
    rawTaxShape !== undefined &&
    rawTaxShape !== null &&
    String(rawTaxShape).trim() !== ""
  );
}

export function chargedPercentsForTaxShape(copyTrio, taxShape) {
  if (taxShape === TAX_SHAPE_WITHIN_STATE) {
    return { cgst: copyTrio.cgst, sgst: copyTrio.sgst, igst: 0 };
  }
  if (taxShape === TAX_SHAPE_INTERSTATE) {
    return { cgst: 0, sgst: 0, igst: copyTrio.igst };
  }
  throw new BillValidationError("Tax shape is not valid");
}

function copyTrioMatchesStored(copyTrio, storedLine) {
  const stored = validateTaxCopyTrio(
    storedLine.cgst_percent,
    storedLine.sgst_percent,
    storedLine.igst_percent
  );
  return (
    copyTrio.cgst === stored.cgst &&
    copyTrio.sgst === stored.sgst &&
    copyTrio.igst === stored.igst
  );
}

export function computeLineFinancialsFromCopyTrio({ quantity, rate, copyTrio, taxShape }) {
  const charged = chargedPercentsForTaxShape(copyTrio, taxShape);
  const financials = computeLineFinancials({
    quantity,
    rate,
    cgstPercent: charged.cgst,
    sgstPercent: charged.sgst,
    igstPercent: charged.igst,
  });
  return {
    ...financials,
    cgst_percent: copyTrio.cgst,
    sgst_percent: copyTrio.sgst,
    igst_percent: copyTrio.igst,
  };
}

export function computeLineFinancials({
  quantity,
  rate,
  cgstPercent,
  sgstPercent,
  igstPercent,
}) {
  const price = roundHalfUpToPaise(quantity * rate);
  const { cgst, sgst, igst } = validateTaxPercentShape(cgstPercent, sgstPercent, igstPercent);
  const cgstAmount = roundHalfUpToPaise((price * cgst) / 100);
  const sgstAmount = roundHalfUpToPaise((price * sgst) / 100);
  const igstAmount = roundHalfUpToPaise((price * igst) / 100);
  const lineTotal = roundHalfUpToPaise(price + cgstAmount + sgstAmount + igstAmount);
  return {
    price,
    cgst_percent: cgst,
    sgst_percent: sgst,
    igst_percent: igst,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    igst_amount: igstAmount,
    line_total: lineTotal,
  };
}

export function computeBillTotalsFromLines(lines) {
  let totalValue = 0;
  let totalTax = 0;
  const computedLines = lines.map((line) => {
    const financials = computeLineFinancials({
      quantity: line.quantity,
      rate: line.rate,
      cgstPercent: line.cgst_percent,
      sgstPercent: line.sgst_percent,
      igstPercent: line.igst_percent,
    });
    totalValue = roundHalfUpToPaise(totalValue + financials.price);
    totalTax = roundHalfUpToPaise(
      totalTax + financials.cgst_amount + financials.sgst_amount + financials.igst_amount
    );
    return { ...line, ...financials };
  });
  const totalBill = roundHalfUpToPaise(totalValue + totalTax);
  return {
    total_value: totalValue,
    total_tax: totalTax,
    total_bill: totalBill,
    lines: computedLines,
  };
}

export function previewBillTotals(input) {
  rejectDiscountInPayload(input);
  const taxShape = parseTaxShape(input?.tax_shape, { required: false });
  const legacySharedShape = taxShape
    ? null
    : inferLegacyBillSharedShape(
        (input?.lines ?? []).filter((line) => !isBlankBillLine(line) && !isHalfFilledBillLine(line))
      );
  const legacyChargeShape =
    legacySharedShape === LEGACY_BILL_SHAPE_MIXED ? null : legacySharedShape;
  let totalValue = 0;
  let totalTax = 0;
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
    let financials;
    if (taxShape) {
      const copyTrio = validateTaxCopyTrio(
        line.cgst_percent ?? 0,
        line.sgst_percent ?? 0,
        line.igst_percent ?? 0
      );
      financials = computeLineFinancialsFromCopyTrio({
        quantity,
        rate,
        copyTrio,
        taxShape,
      });
    } else if (isTruthyFlag(line.tax_rates_are_copy) && legacyChargeShape) {
      const copyTrio = validateTaxCopyTrio(
        line.cgst_percent ?? 0,
        line.sgst_percent ?? 0,
        line.igst_percent ?? 0
      );
      financials = computeLineFinancialsFromCopyTrio({
        quantity,
        rate,
        copyTrio,
        taxShape: legacyChargeShape,
      });
    } else {
      validateTaxPercentShape(
        line.cgst_percent ?? 0,
        line.sgst_percent ?? 0,
        line.igst_percent ?? 0
      );
      financials = computeLineFinancials({
        quantity,
        rate,
        cgstPercent: line.cgst_percent ?? 0,
        sgstPercent: line.sgst_percent ?? 0,
        igstPercent: line.igst_percent ?? 0,
      });
    }
    linePreviews.push(financials);
    totalValue = roundHalfUpToPaise(totalValue + financials.price);
    totalTax = roundHalfUpToPaise(
      totalTax + financials.cgst_amount + financials.sgst_amount + financials.igst_amount
    );
  }
  if (linePreviews.every((preview) => preview === null)) {
    return {
      total_value: 0,
      total_tax: 0,
      total_bill: 0,
      line_previews: linePreviews,
    };
  }
  return {
    total_value: totalValue,
    total_tax: totalTax,
    total_bill: roundHalfUpToPaise(totalValue + totalTax),
    line_previews: linePreviews,
  };
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
    line_total: Number(row.line_total),
    tax_rates_are_copy: Boolean(row.tax_rates_are_copy),
  };
}

function formatBillRow(row, lines) {
  return {
    bill_id: row.bill_id,
    collection_id: row.collection_id,
    bill_number: row.bill_number,
    bill_number_parts: splitBillNumber(row.bill_number),
    bill_date: normalizeBillCalendarDate(row.bill_date),
    receiver_mobile: row.receiver_mobile,
    receiver_name: row.receiver_name,
    receiver_address: row.receiver_address,
    receiver_gst_number: row.receiver_gst_number,
    receiver_contact_person: row.receiver_contact_person,
    receiver_contact_number: row.receiver_contact_number,
    total_value: Number(row.total_value),
    total_tax: Number(row.total_tax),
    total_bill: Number(row.total_bill),
    tax_shape: row.tax_shape ?? null,
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
    bill_date: normalizeBillCalendarDate(row.bill_date),
    receiver_name: row.receiver_name,
    total_bill: Number(row.total_bill),
    saved_at: row.saved_at,
  };
}

const MAX_BILLS_PAGE_SIZE = 200;

export function resolveBillListPagination({ page, limit } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(
    MAX_BILLS_PAGE_SIZE,
    Math.max(1, Number.parseInt(limit, 10) || 10)
  );

  return { page: parsedPage, limit: parsedLimit, offset: (parsedPage - 1) * parsedLimit };
}

export async function listBills(deps, collectionId, query = {}) {
  const { page, limit, offset } = resolveBillListPagination(query);
  const search = query.search ?? "";
  const { rows, totalItems } = await deps.listBillsByCollection(collectionId, {
    limit,
    offset,
    search,
  });

  return {
    bills: rows.map(formatBillListRow),
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    },
  };
}

export async function getBill(deps, collectionId, billId) {
  const row = await deps.getBillById(billId);
  if (!row || row.collection_id !== collectionId) {
    throw new BillNotFoundError();
  }
  const lines = await deps.listBillLines(billId);
  return formatBillRow(row, lines);
}

export const BILL_EXPORT_SPAN_BILL_NUMBER = "bill-number";
export const BILL_EXPORT_SPAN_BILL_DATE = "bill-date";

export const BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE =
  "The bill number is not one series of whole numbers";

export const BILL_EXPORT_ONE_SPAN_MESSAGE =
  "Export must be either a bill number span or a bill date span";

function parseBillExportSeriesPart(raw) {
  if (raw === undefined || raw === null) {
    throw new BillValidationError(BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE);
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    throw new BillValidationError(BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE);
  }
  if (trimmed.includes("-")) {
    throw new BillValidationError(BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE);
  }
  if (trimmed.length > BILL_NUMBER_PART_MAX) {
    throw new BillValidationError(BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE);
  }
  return trimmed;
}

function parseBillExportThirdPart(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new BillValidationError(BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE);
  }
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new BillValidationError(BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE);
  }
  return { text: trimmed, int: BigInt(trimmed) };
}

function billMatchesBillNumberSpan(row, seriesPart1, seriesPart2, lowInt, highInt) {
  const parts = splitBillNumber(row.bill_number);
  if (!parts) {
    return null;
  }
  if (parts[0] !== seriesPart1 || parts[1] !== seriesPart2) {
    return null;
  }
  const thirdText = parts[2];
  if (!/^\d+$/.test(thirdText)) {
    return null;
  }
  const thirdInt = BigInt(thirdText);
  if (thirdInt < lowInt || thirdInt > highInt) {
    return null;
  }
  return { thirdText, thirdInt };
}

function compareBillNumberSpanEntries(a, b) {
  if (a.thirdInt < b.thirdInt) {
    return -1;
  }
  if (a.thirdInt > b.thirdInt) {
    return 1;
  }
  return a.thirdText.localeCompare(b.thirdText);
}

function exportSpanFieldPresent(raw) {
  return raw !== undefined && raw !== null && String(raw).trim() !== "";
}

function hasBillNumberExportFields(rawInput) {
  return (
    exportSpanFieldPresent(rawInput?.series_part_1 ?? rawInput?.series_parts?.[0]) ||
    exportSpanFieldPresent(rawInput?.series_part_2 ?? rawInput?.series_parts?.[1]) ||
    exportSpanFieldPresent(rawInput?.from_third_part ?? rawInput?.from_third ?? rawInput?.third_from) ||
    exportSpanFieldPresent(rawInput?.to_third_part ?? rawInput?.to_third ?? rawInput?.third_to)
  );
}

function hasBillDateExportFields(rawInput) {
  return (
    exportSpanFieldPresent(rawInput?.from_date ?? rawInput?.fromDate) ||
    exportSpanFieldPresent(rawInput?.to_date ?? rawInput?.toDate)
  );
}

function assertSingleExportSpan(rawInput) {
  if (hasBillNumberExportFields(rawInput) && hasBillDateExportFields(rawInput)) {
    throw new BillValidationError(BILL_EXPORT_ONE_SPAN_MESSAGE);
  }
}

function compareBillExportStoredText(left, right) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function compareBillExportThirdParts(thirdA, thirdB) {
  const aDigits = /^\d+$/.test(thirdA);
  const bDigits = /^\d+$/.test(thirdB);
  if (aDigits && bDigits) {
    const aInt = BigInt(thirdA);
    const bInt = BigInt(thirdB);
    if (aInt < bInt) {
      return -1;
    }
    if (aInt > bInt) {
      return 1;
    }
    return compareBillExportStoredText(thirdA, thirdB);
  }
  if (aDigits && !bDigits) {
    return -1;
  }
  if (!aDigits && bDigits) {
    return 1;
  }
  return compareBillExportStoredText(thirdA, thirdB);
}

function compareBillDateSpanEntries(a, b) {
  if (a.billDate !== b.billDate) {
    return a.billDate < b.billDate ? -1 : 1;
  }
  const part0Order = compareBillExportStoredText(a.part0, b.part0);
  if (part0Order !== 0) {
    return part0Order;
  }
  const part1Order = compareBillExportStoredText(a.part1, b.part1);
  if (part1Order !== 0) {
    return part1Order;
  }
  return compareBillExportThirdParts(a.part2, b.part2);
}

async function formatExportBills(deps, matchedRows) {
  const bills = [];
  for (const row of matchedRows) {
    const lines = await deps.listBillLines(row.bill_id);
    bills.push(formatBillRow(row, lines));
  }
  return { bills };
}

async function exportBillNumberSpan(deps, collectionId, rawInput) {
  const seriesPart1 = parseBillExportSeriesPart(
    rawInput?.series_part_1 ?? rawInput?.series_parts?.[0]
  );
  const seriesPart2 = parseBillExportSeriesPart(
    rawInput?.series_part_2 ?? rawInput?.series_parts?.[1]
  );
  const fromThird = parseBillExportThirdPart(
    rawInput?.from_third_part ?? rawInput?.from_third ?? rawInput?.third_from
  );
  const toThird = parseBillExportThirdPart(
    rawInput?.to_third_part ?? rawInput?.to_third ?? rawInput?.third_to
  );

  const lowInt = fromThird.int < toThird.int ? fromThird.int : toThird.int;
  const highInt = fromThird.int > toThird.int ? fromThird.int : toThird.int;

  const rows = await deps.listAllBillsByCollection(collectionId);
  const matched = [];
  for (const row of rows) {
    const spanMatch = billMatchesBillNumberSpan(row, seriesPart1, seriesPart2, lowInt, highInt);
    if (!spanMatch) {
      continue;
    }
    matched.push({ row, ...spanMatch });
  }

  matched.sort(compareBillNumberSpanEntries);

  return formatExportBills(deps, matched.map((entry) => entry.row));
}

async function exportBillDateSpan(deps, collectionId, rawInput) {
  const fromDate = parseBillDate(rawInput?.from_date ?? rawInput?.fromDate);
  const toDate = parseBillDate(rawInput?.to_date ?? rawInput?.toDate);

  const lowDate = fromDate < toDate ? fromDate : toDate;
  const highDate = fromDate > toDate ? fromDate : toDate;

  const rows = await deps.listAllBillsByCollection(collectionId);
  const matched = [];
  for (const row of rows) {
    const billDate = normalizeBillCalendarDate(row.bill_date);
    if (billDate < lowDate || billDate > highDate) {
      continue;
    }
    const parts = splitBillNumber(row.bill_number);
    if (!parts) {
      continue;
    }
    matched.push({
      row,
      billDate,
      part0: parts[0],
      part1: parts[1],
      part2: parts[2],
    });
  }

  matched.sort(compareBillDateSpanEntries);

  return formatExportBills(deps, matched.map((entry) => entry.row));
}

export async function exportBills(deps, collectionId, rawInput) {
  assertSingleExportSpan(rawInput);

  const spanType = rawInput?.span_type ?? rawInput?.spanType;
  if (spanType === BILL_EXPORT_SPAN_BILL_NUMBER) {
    return exportBillNumberSpan(deps, collectionId, rawInput);
  }
  if (spanType === BILL_EXPORT_SPAN_BILL_DATE) {
    return exportBillDateSpan(deps, collectionId, rawInput);
  }

  throw new BillValidationError(BILL_EXPORT_ONE_SPAN_MESSAGE);
}

function productTaxCodeId(product) {
  const raw = product?.tax_code_id;
  if (raw === undefined || raw === null) {
    return "";
  }
  return String(raw).trim();
}

function assertProductTaxCodeForNewLine(product, submittedTaxCodeId) {
  const productTaxCodeIdValue = productTaxCodeId(product);
  if (!productTaxCodeIdValue) {
    throw new BillValidationError("This product has no HSN/SAC");
  }
  if (submittedTaxCodeId !== productTaxCodeIdValue) {
    throw new BillValidationError("The tax code must match the product's HSN/SAC");
  }
}

function isTruthyFlag(raw) {
  if (raw === true || raw === 1) {
    return true;
  }
  if (typeof raw === "string") {
    const text = raw.trim().toLowerCase();
    return text === "true" || text === "1" || text === "yes";
  }
  return false;
}

function isFreshProductChoice(existingLine, productId, productChosenAgain) {
  if (!existingLine) {
    return true;
  }
  if (existingLine.product_id !== productId) {
    return true;
  }
  return isTruthyFlag(productChosenAgain);
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

function assertTotalBillGreaterThanZero(totalBill) {
  if (roundHalfUpToPaise(totalBill) <= 0) {
    throw new BillValidationError("The Total bill must be greater than 0");
  }
}

async function resolveKeptLines(deps, collectionId, rawLines, taxShape) {
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
    assertProductTaxCodeForNewLine(product, taxCodeId);
    const taxCode = await deps.getTaxCodeById(taxCodeId);
    if (!taxCode) {
      throw new BillValidationError("Tax code is not known");
    }
    const quantity = parseQuantity(line.quantity);
    const rate = parseRate(line.rate);
    const copyTrio = validateTaxCopyTrio(
      line.cgst_percent ?? 0,
      line.sgst_percent ?? 0,
      line.igst_percent ?? 0
    );
    const financials = computeLineFinancialsFromCopyTrio({
      quantity,
      rate,
      copyTrio,
      taxShape,
    });
    keptInputs.push({
      product_id: productId,
      product_name: product.product_name,
      tax_code_id: taxCodeId,
      tax_code: taxCode.code,
      tax_code_description: taxCode.description,
      quantity,
      rate,
      tax_rates_are_copy: true,
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

async function assertBillNumberAvailable(deps, collectionId, billNumber, excludeBillId = null) {
  const existing = await deps.getBillByBillNumber(collectionId, billNumber);
  if (existing && existing.bill_id !== excludeBillId) {
    throw new BillDuplicateNumberError();
  }
}

export async function createBill(deps, collectionId, rawInput) {
  rejectDiscountInPayload(rawInput);
  const taxShape = parseTaxShape(rawInput?.tax_shape);
  const { billNumber } = parseBillNumberParts(rawInput?.bill_number_parts);
  const billDate = parseBillDate(rawInput?.bill_date);
  await assertBillNumberAvailable(deps, collectionId, billNumber);
  const receiver = await resolveReceiver(deps, rawInput?.receiver_mobile);
  const bank = await copyShopBankBlock(deps);
  const keptLines = await resolveKeptLines(deps, collectionId, rawInput?.lines, taxShape);

  let totalValue = 0;
  let totalTax = 0;
  for (const line of keptLines) {
    totalValue = roundHalfUpToPaise(totalValue + line.price);
    totalTax = roundHalfUpToPaise(
      totalTax + line.cgst_amount + line.sgst_amount + line.igst_amount
    );
  }
  const totalBill = roundHalfUpToPaise(totalValue + totalTax);
  assertTotalBillGreaterThanZero(totalBill);

  const billId = randomUUID();
  const savedAt = new Date().toISOString();
  const billRow = {
    bill_id: billId,
    collection_id: collectionId,
    bill_number: billNumber,
    bill_date: billDate,
    ...receiver,
    total_value: totalValue,
    total_tax: totalTax,
    total_bill: totalBill,
    tax_shape: taxShape,
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
  rejectDiscountInPayload(rawInput);
  const existing = await deps.getBillById(billId);
  if (!existing || existing.collection_id !== collectionId) {
    throw new BillNotFoundError();
  }
  const { billNumber } = parseBillNumberParts(rawInput?.bill_number_parts);
  const billDate = parseBillDate(rawInput?.bill_date);
  await assertBillNumberAvailable(deps, collectionId, billNumber, billId);

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

  const { keptLines, taxShape: resolvedTaxShape } = await resolveKeptLinesForUpdate(
    deps,
    collectionId,
    billId,
    rawInput?.lines,
    existing,
    rawInput?.tax_shape
  );

  let totalValue = 0;
  let totalTax = 0;
  for (const line of keptLines) {
    totalValue = roundHalfUpToPaise(totalValue + line.price);
    totalTax = roundHalfUpToPaise(
      totalTax + line.cgst_amount + line.sgst_amount + line.igst_amount
    );
  }
  const totalBill = roundHalfUpToPaise(totalValue + totalTax);
  assertTotalBillGreaterThanZero(totalBill);

  const savedAt = new Date().toISOString();
  const billRow = {
    ...existing,
    bill_number: billNumber,
    bill_date: billDate,
    ...receiver,
    total_value: totalValue,
    total_tax: totalTax,
    total_bill: totalBill,
    tax_shape: resolvedTaxShape ?? existing.tax_shape ?? null,
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

async function resolveKeptLinesForUpdate(
  deps,
  collectionId,
  billId,
  rawLines,
  existingBill,
  rawTaxShape
) {
  const billTaxShape = existingBill.tax_shape ?? null;
  if (billTaxShape === null) {
    return resolveKeptLinesLegacy(deps, collectionId, billId, rawLines, rawTaxShape);
  }

  const taxShape = parseTaxShape(rawTaxShape);
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
    const copyTrio = validateTaxCopyTrio(
      line.cgst_percent ?? 0,
      line.sgst_percent ?? 0,
      line.igst_percent ?? 0
    );

    const existingLine = lineId ? existingByLineId.get(lineId) : null;
    const freshProductChoice = isFreshProductChoice(
      existingLine,
      productId,
      line.product_chosen_again
    );

    let resolvedTaxCodeId = taxCodeId;
    let taxCodeValue;
    let taxCodeDescription;
    let productName;
    let taxRatesAreCopy = true;

    if (!freshProductChoice) {
      if (!existingLine?.tax_rates_are_copy) {
        throw new BillValidationError("The copied rates cannot change unless the product is chosen again");
      }
      if (!copyTrioMatchesStored(copyTrio, existingLine)) {
        throw new BillValidationError("The copied rates cannot change unless the product is chosen again");
      }
      const storedTaxCodeId = String(existingLine.tax_code_id).trim();
      if (taxCodeId !== storedTaxCodeId) {
        throw new BillValidationError(
          "The tax code cannot change unless the product is chosen again"
        );
      }
      resolvedTaxCodeId = storedTaxCodeId;
      taxCodeValue = existingLine.tax_code;
      taxCodeDescription = existingLine.tax_code_description;
      productName = existingLine.product_name;
    } else {
      assertProductTaxCodeForNewLine(product, taxCodeId);
      resolvedTaxCodeId = taxCodeId;
      taxCodeValue = taxCode.code;
      taxCodeDescription = taxCode.description;
      productName =
        existingLine && existingLine.product_id === productId
          ? existingLine.product_name
          : product.product_name;
      taxRatesAreCopy = true;
    }

    const financials = computeLineFinancialsFromCopyTrio({
      quantity,
      rate,
      copyTrio,
      taxShape,
    });

    keptInputs.push({
      bill_line_id: lineId ?? randomUUID(),
      product_id: productId,
      product_name: productName,
      tax_code_id: resolvedTaxCodeId,
      tax_code: taxCodeValue,
      tax_code_description: taxCodeDescription,
      quantity,
      rate,
      tax_rates_are_copy: taxRatesAreCopy,
      ...financials,
    });
  }

  if (keptInputs.length === 0) {
    throw new BillValidationError("A bill needs at least one line");
  }
  return { keptLines: keptInputs, taxShape };
}

async function resolveKeptLinesLegacy(deps, collectionId, billId, rawLines, rawTaxShape) {
  const existingLines = await deps.listBillLines(billId);
  const existingByLineId = new Map(existingLines.map((line) => [line.bill_line_id, line]));
  const sharedShapeFromKept = inferLegacySharedShapeForKeptPayload(existingByLineId, rawLines);
  const isMixed = sharedShapeFromKept === LEGACY_BILL_SHAPE_MIXED;
  const sharedShape = isMixed ? null : sharedShapeFromKept;
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

    const existingLine = lineId ? existingByLineId.get(lineId) : null;
    const isNewLine = !existingLine;
    const freshProductChoice = isFreshProductChoice(
      existingLine,
      productId,
      line.product_chosen_again
    );

    let resolvedTaxCodeId = taxCodeId;
    let taxCodeValue;
    let taxCodeDescription;
    let productName;

    if (!freshProductChoice) {
      const storedTaxCodeId = String(existingLine.tax_code_id).trim();
      if (taxCodeId !== storedTaxCodeId) {
        throw new BillValidationError(
          "The tax code cannot change unless the product is chosen again"
        );
      }
      resolvedTaxCodeId = storedTaxCodeId;
      taxCodeValue = existingLine.tax_code;
      taxCodeDescription = existingLine.tax_code_description;
      productName = existingLine.product_name;
    } else {
      assertProductTaxCodeForNewLine(product, taxCodeId);
      resolvedTaxCodeId = taxCodeId;
      taxCodeValue = taxCode.code;
      taxCodeDescription = taxCode.description;
      productName =
        existingLine && existingLine.product_id === productId
          ? existingLine.product_name
          : product.product_name;
    }

    let taxRatesAreCopy = Boolean(existingLine?.tax_rates_are_copy);
    let financials;

    if (isMixed) {
      let percents;
      if (!freshProductChoice && existingLine) {
        percents = validateTaxPercentShape(
          line.cgst_percent ?? 0,
          line.sgst_percent ?? 0,
          line.igst_percent ?? 0
        );
        if (!chargedPercentsMatchStored(percents, existingLine)) {
          throw new BillValidationError(
            "The charged rates cannot change unless the product is chosen again"
          );
        }
      } else {
        const lineShape = existingLine
          ? chargedShapeFromLegacyPercents(
              existingLine.cgst_percent,
              existingLine.sgst_percent,
              existingLine.igst_percent
            )
          : TAX_SHAPE_WITHIN_STATE;
        const resolvedShape =
          lineShape === "exempt" ? TAX_SHAPE_WITHIN_STATE : lineShape;
        const fromCode = chargedPercentsFromTaxCodeForLineShape(taxCode, resolvedShape);
        percents = validateTaxPercentShape(fromCode.cgst, fromCode.sgst, fromCode.igst);
      }
      taxRatesAreCopy = false;
      financials = computeLineFinancials({
        quantity,
        rate,
        cgstPercent: percents.cgst,
        sgstPercent: percents.sgst,
        igstPercent: percents.igst,
      });
    } else if (taxRatesAreCopy || isNewLine || freshProductChoice) {
      const copyTrio = validateTaxCopyTrio(
        line.cgst_percent ?? 0,
        line.sgst_percent ?? 0,
        line.igst_percent ?? 0
      );
      if (!freshProductChoice && !isNewLine && existingLine?.tax_rates_are_copy) {
        if (!copyTrioMatchesStored(copyTrio, existingLine)) {
          throw new BillValidationError(
            "The copied rates cannot change unless the product is chosen again"
          );
        }
      }
      taxRatesAreCopy = true;
      financials = computeLineFinancialsFromCopyTrio({
        quantity,
        rate,
        copyTrio,
        taxShape: sharedShape,
      });
    } else {
      const percents = validateTaxPercentShape(
        line.cgst_percent ?? 0,
        line.sgst_percent ?? 0,
        line.igst_percent ?? 0
      );
      if (!chargedPercentsMatchStored(percents, existingLine)) {
        throw new BillValidationError(
          "The charged rates cannot change unless the product is chosen again"
        );
      }
      taxRatesAreCopy = false;
      financials = computeLineFinancials({
        quantity,
        rate,
        cgstPercent: percents.cgst,
        sgstPercent: percents.sgst,
        igstPercent: percents.igst,
      });
    }

    keptInputs.push({
      bill_line_id: lineId ?? randomUUID(),
      product_id: productId,
      product_name: productName,
      tax_code_id: resolvedTaxCodeId,
      tax_code: taxCodeValue,
      tax_code_description: taxCodeDescription,
      quantity,
      rate,
      tax_rates_are_copy: taxRatesAreCopy,
      ...financials,
    });
  }

  if (keptInputs.length === 0) {
    throw new BillValidationError("A bill needs at least one line");
  }

  const allCopy = keptInputs.every((line) => line.tax_rates_are_copy);
  const taxShapeSubmitted = hasTaxShapeInPayload(rawTaxShape);

  if (isMixed) {
    if (taxShapeSubmitted) {
      throw new BillValidationError("This bill does not use a tax shape");
    }
    return { keptLines: keptInputs, taxShape: null };
  }

  if (allCopy) {
    if (!taxShapeSubmitted) {
      throw new BillValidationError("Tax shape is required");
    }
    const submittedShape = parseTaxShape(rawTaxShape);
    if (submittedShape !== sharedShape) {
      throw new BillValidationError(
        "Tax shape does not match the shape this bill already shares"
      );
    }
    return { keptLines: keptInputs, taxShape: submittedShape };
  }

  if (taxShapeSubmitted) {
    throw new BillValidationError(
      "Tax shape cannot be set until every line has been chosen again"
    );
  }
  return { keptLines: keptInputs, taxShape: null };
}
