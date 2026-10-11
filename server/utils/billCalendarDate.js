/** Calendar dates on a bill have no time zone; keep the local calendar day. */

function formatLocalCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeBillCalendarDate(value) {
  if (value === undefined || value === null || value === "") {
    return value;
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
