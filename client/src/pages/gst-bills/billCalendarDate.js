import { format } from "date-fns";

/** Bill dates are calendar days only — keep the local day, never the UTC day. */

function formatLocalCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeBillCalendarDate(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (value instanceof Date) {
    return formatLocalCalendarDate(value);
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return formatLocalCalendarDate(parsed);
  }
  return text;
}

export function billCalendarDateToLocalDate(iso) {
  const normalized = normalizeBillCalendarDate(iso);
  if (!normalized) {
    return null;
  }
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatBillCalendarDate(iso) {
  const date = billCalendarDateToLocalDate(iso);
  if (!date) {
    return "";
  }
  return format(date, "dd/MM/yyyy");
}

export function localDateToBillCalendarIso(date) {
  return format(date, "yyyy-MM-dd");
}
