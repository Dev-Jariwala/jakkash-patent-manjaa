export const BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE =
  "The bill number is not one series of whole numbers";

export const BILL_EXPORT_SPAN_BILL_NUMBER = "bill-number";
export const BILL_EXPORT_SPAN_BILL_DATE = "bill-date";

const SERIES_PART_MAX = 20;

function parseSeriesPart(raw) {
  if (raw === undefined || raw === null) {
    return { ok: false };
  }
  const trimmed = String(raw).trim();
  if (trimmed.length === 0) {
    return { ok: false };
  }
  if (trimmed.includes("-")) {
    return { ok: false };
  }
  if (trimmed.length > SERIES_PART_MAX) {
    return { ok: false };
  }
  return { ok: true, value: trimmed };
}

function parseThirdPart(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { ok: false };
  }
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false };
  }
  return { ok: true, value: trimmed };
}

function isValidBillCalendarDate(raw) {
  const text = String(raw ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseBillExportDate(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { ok: false, message: "Bill date is required" };
  }
  const trimmed = String(raw).trim();
  if (!isValidBillCalendarDate(trimmed)) {
    return { ok: false, message: "Bill date is not valid" };
  }
  return { ok: true, value: trimmed };
}

export function validateBillNumberExportForm({ seriesPart1, seriesPart2, fromThird, toThird }) {
  const part1 = parseSeriesPart(seriesPart1);
  const part2 = parseSeriesPart(seriesPart2);
  const from = parseThirdPart(fromThird);
  const to = parseThirdPart(toThird);

  if (!part1.ok || !part2.ok || !from.ok || !to.ok) {
    return { ok: false, message: BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE };
  }

  return {
    ok: true,
    payload: {
      span_type: BILL_EXPORT_SPAN_BILL_NUMBER,
      series_part_1: part1.value,
      series_part_2: part2.value,
      from_third_part: from.value,
      to_third_part: to.value,
    },
  };
}

export function validateBillDateExportForm({ fromDate, toDate }) {
  const from = parseBillExportDate(fromDate);
  if (!from.ok) {
    return { ok: false, message: from.message };
  }
  const to = parseBillExportDate(toDate);
  if (!to.ok) {
    return { ok: false, message: to.message };
  }

  return {
    ok: true,
    payload: {
      span_type: BILL_EXPORT_SPAN_BILL_DATE,
      from_date: from.value,
      to_date: to.value,
    },
  };
}

export function validateGstBillExportForm(spanType, fields) {
  if (spanType === BILL_EXPORT_SPAN_BILL_DATE) {
    return validateBillDateExportForm(fields);
  }
  return validateBillNumberExportForm(fields);
}
