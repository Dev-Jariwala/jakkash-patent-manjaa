import { normalizeBillCalendarDate } from "@/pages/gst-bills/billCalendarDate";

const ONES = [
  "",
  "ONE",
  "TWO",
  "THREE",
  "FOUR",
  "FIVE",
  "SIX",
  "SEVEN",
  "EIGHT",
  "NINE",
  "TEN",
  "ELEVEN",
  "TWELVE",
  "THIRTEEN",
  "FOURTEEN",
  "FIFTEEN",
  "SIXTEEN",
  "SEVENTEEN",
  "EIGHTEEN",
  "NINETEEN",
];

const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

const SCALES = ["THOUSAND", "LAKH", "CRORE", "ARAB", "KHARAB"];

function toPaise(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.round((n + Number.EPSILON) * 100);
}

export function roundHalfUpToPaise(amount) {
  return toPaise(amount) / 100;
}

function twoDigits(n) {
  if (n < 20) {
    return ONES[n];
  }
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return one ? `${TENS[ten]} ${ONES[one]}` : TENS[ten];
}

function threeDigits(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (hundred) {
    parts.push(`${ONES[hundred]} HUNDRED`);
  }
  if (rest) {
    parts.push(twoDigits(rest));
  }
  return parts.join(" ");
}

function indianIntegerWords(n) {
  if (n === 0) {
    return "ZERO";
  }
  let remaining = n;
  const hundreds = remaining % 1000;
  remaining = Math.floor(remaining / 1000);
  const groups = [];
  while (remaining > 0) {
    groups.push(remaining % 100);
    remaining = Math.floor(remaining / 100);
  }
  const parts = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    if (!groups[index]) {
      continue;
    }
    const scale = SCALES[index] ?? "";
    parts.push(scale ? `${twoDigits(groups[index])} ${scale}` : twoDigits(groups[index]));
  }
  if (hundreds) {
    parts.push(threeDigits(hundreds));
  }
  return parts.join(" ");
}

export function amountInWords(amount) {
  const paiseTotal = toPaise(amount);
  const sign = paiseTotal < 0 ? "MINUS " : "";
  const abs = Math.abs(paiseTotal);
  const rupees = Math.floor(abs / 100);
  const paise = abs % 100;
  const rupeeWords = indianIntegerWords(rupees);
  if (paise === 0) {
    return `${sign}${rupeeWords} INR ONLY`;
  }
  return `${sign}${rupeeWords} INR AND ${twoDigits(paise)} PAISE ONLY`;
}

export function formatInvoiceDate(value) {
  const normalized = normalizeBillCalendarDate(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!match) {
    return "";
  }
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function formatLineAmount(value) {
  return `${roundHalfUpToPaise(value).toFixed(2)}/-`;
}

export function formatSummaryAmount(value) {
  const n = roundHalfUpToPaise(value);
  const hasPaise = Math.abs(toPaise(n)) % 100 !== 0;
  const formatted = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  });
  const sign = n < 0 ? "-" : "";
  return `₹ ${sign}${formatted}/-`;
}

export function receiverContactPhone(bill) {
  const contactNumber = String(bill?.receiver_contact_number ?? "").trim();
  if (contactNumber) {
    return contactNumber;
  }
  return String(bill?.receiver_mobile ?? "").trim();
}

export function sumLineAmount(lines, key) {
  const total = (lines ?? []).reduce((sum, line) => sum + Number(line?.[key] ?? 0), 0);
  return roundHalfUpToPaise(total);
}

export function invoiceFigures(bill) {
  const lines = bill?.lines ?? [];
  const taxable = roundHalfUpToPaise(bill?.total_value);
  const finalAmount = roundHalfUpToPaise(bill?.total_bill);
  return {
    taxable,
    cgst: sumLineAmount(lines, "cgst_amount"),
    sgst: sumLineAmount(lines, "sgst_amount"),
    igst: sumLineAmount(lines, "igst_amount"),
    finalAmount,
    words: amountInWords(finalAmount),
  };
}
