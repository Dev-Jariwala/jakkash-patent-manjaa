const BILL_NUMBER_PART_MAX = 20;
const RATE_PATTERN = /^\d+(\.\d{1,2})?$/;
const PERCENT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function emptyLineFieldErrors() {
  return {
    product: null,
    quantity: null,
    rate: null,
    cgst: null,
    sgst: null,
    igst: null,
    tax: null,
    line: null,
  };
}

export function emptyGstBillFormErrors(lineCount) {
  return {
    billNumberParts: [null, null, null],
    billDate: null,
    receiver: null,
    discountPercent: null,
    lines: Array.from({ length: lineCount }, () => emptyLineFieldErrors()),
    general: null,
  };
}

function isBlankLine(line) {
  return (
    !line.product_id &&
    !line.tax_code_id &&
    !String(line.quantity ?? "").trim()
  );
}

function isHalfFilledLine(line) {
  if (isBlankLine(line)) {
    return false;
  }
  return !(
    Boolean(line.product_id) &&
    Boolean(line.tax_code_id) &&
    Boolean(String(line.quantity ?? "").trim())
  );
}

function parsePercentMessage(raw, label) {
  if (raw === undefined || raw === null || raw === "") {
    return `${label} is required`;
  }
  const text = String(raw).trim();
  if (!PERCENT_PATTERN.test(text)) {
    return `${label} must be zero or greater with at most two decimal places`;
  }
  const value = Math.round((Number(text) + Number.EPSILON) * 100) / 100;
  if (value < 0) {
    return `${label} must be zero or greater with at most two decimal places`;
  }
  return null;
}

function validateTaxPercentShapeMessage(cgstPercent, sgstPercent, igstPercent) {
  const toAmount = (raw) =>
    Math.round((Number(String(raw).trim()) + Number.EPSILON) * 100) / 100;
  const cgst = toAmount(cgstPercent);
  const sgst = toAmount(sgstPercent);
  const igst = toAmount(igstPercent);
  if (![cgst, sgst, igst].every((n) => Number.isFinite(n) && n >= 0)) {
    return "Tax percents must be zero or greater with at most two decimal places";
  }
  const withinState = cgst === sgst && igst === 0;
  const igstOnly = cgst === 0 && sgst === 0;
  if (!withinState && !igstOnly) {
    return "Tax percents must be equal CGST and SGST with IGST 0, or CGST and SGST both 0 with IGST only";
  }
  return null;
}

function isValidBillDate(raw) {
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

export function validateGstBillForm({
  billNumberParts,
  billDate,
  receiverMobile,
  discountPercent,
  lines,
  clients,
}) {
  const errors = emptyGstBillFormErrors(lines.length);
  let hasError = false;

  if (!Array.isArray(billNumberParts) || billNumberParts.length !== 3) {
    errors.general = "Bill number requires three parts";
    hasError = true;
  } else {
    billNumberParts.forEach((part, index) => {
      const trimmed = String(part ?? "").trim();
      if (!trimmed) {
        errors.billNumberParts[index] = `Part ${index + 1} is required`;
        hasError = true;
      } else if (trimmed.includes("-")) {
        errors.billNumberParts[index] = "A bill number part cannot contain a hyphen";
        hasError = true;
      } else if (trimmed.length > BILL_NUMBER_PART_MAX) {
        errors.billNumberParts[index] = "A bill number part is too long";
        hasError = true;
      }
    });
  }

  if (!billDate || String(billDate).trim() === "") {
    errors.billDate = "Bill date is required";
    hasError = true;
  } else if (!isValidBillDate(billDate)) {
    errors.billDate = "Bill date is not valid";
    hasError = true;
  }

  const mobile = String(receiverMobile ?? "").trim();
  if (!mobile) {
    errors.receiver = "Receiver is required";
    hasError = true;
  } else {
    const client = clients.find((c) => c.mobile === mobile);
    if (!client) {
      errors.receiver = "Receiver is not a known client";
      hasError = true;
    } else if (!String(client.gst_number ?? "").trim()) {
      errors.receiver = "Receiver must be a client with a GST number";
      hasError = true;
    }
  }

  const discountMessage = parsePercentMessage(discountPercent, "Discount(%)");
  if (discountMessage) {
    errors.discountPercent = discountMessage;
    hasError = true;
  } else {
    const discount = Number(String(discountPercent).trim());
    if (discount < 0 || discount > 100) {
      errors.discountPercent = "Discount(%) must be from 0 to 100";
      hasError = true;
    }
  }

  let completeLineCount = 0;

  lines.forEach((line, index) => {
    if (isBlankLine(line)) {
      return;
    }

    if (isHalfFilledLine(line)) {
      errors.lines[index].line = "Each line needs a product and quantity";
      if (!line.product_id) {
        errors.lines[index].product = "Product is required";
      }
      if (!String(line.quantity ?? "").trim()) {
        errors.lines[index].quantity = "Quantity is required";
      }
      hasError = true;
      return;
    }

    const qtyText = String(line.quantity).trim();
    if (!/^\d+$/.test(qtyText) || Number(qtyText) < 1) {
      errors.lines[index].quantity = "Quantity must be a whole number of at least 1";
      hasError = true;
    }

    const rateText = String(line.rate ?? "").trim();
    if (!rateText) {
      errors.lines[index].rate = "Rate is required";
      hasError = true;
    } else if (!RATE_PATTERN.test(rateText)) {
      errors.lines[index].rate =
        "Rate must be zero or greater with at most two decimal places";
      hasError = true;
    }

    const cgstMessage = parsePercentMessage(line.cgst_percent, "CGST");
    if (cgstMessage) {
      errors.lines[index].cgst = cgstMessage;
      hasError = true;
    }
    const sgstMessage = parsePercentMessage(line.sgst_percent, "SGST");
    if (sgstMessage) {
      errors.lines[index].sgst = sgstMessage;
      hasError = true;
    }
    const igstMessage = parsePercentMessage(line.igst_percent, "IGST");
    if (igstMessage) {
      errors.lines[index].igst = igstMessage;
      hasError = true;
    }

    if (!cgstMessage && !sgstMessage && !igstMessage) {
      const taxShapeMessage = validateTaxPercentShapeMessage(
        line.cgst_percent,
        line.sgst_percent,
        line.igst_percent
      );
      if (taxShapeMessage) {
        errors.lines[index].tax = taxShapeMessage;
      }
    }

    const lineHasError = Object.values(errors.lines[index]).some((message) =>
      Boolean(message)
    );
    if (lineHasError) {
      hasError = true;
    } else {
      completeLineCount += 1;
    }
  });

  if (completeLineCount === 0) {
    errors.general = errors.general || "A bill needs at least one line";
    hasError = true;
  }

  return { hasError, errors };
}
