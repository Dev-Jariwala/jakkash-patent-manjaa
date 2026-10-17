import { describe, expect, it } from "vitest";

import {
  amountInWords,
  discountRupees,
  formatDiscountAmount,
  formatInvoiceDate,
  formatLineAmount,
  formatSummaryAmount,
  invoiceFigures,
  receiverContactPhone,
} from "@/pages/gst-bills/formatGstBillInvoice";

describe("formatGstBillInvoice", () => {
  it("formats the invoice date as day-month-year", () => {
    expect(formatInvoiceDate("2026-10-08")).toBe("08-10-2026");
  });

  it("writes a whole rupee amount in Indian words", () => {
    expect(amountInWords(666892)).toBe(
      "SIX LAKH SIXTY SIX THOUSAND EIGHT HUNDRED NINETY TWO INR ONLY"
    );
  });

  it("includes paise when the amount is not a whole rupee", () => {
    expect(amountInWords(666891.76)).toBe(
      "SIX LAKH SIXTY SIX THOUSAND EIGHT HUNDRED NINETY ONE INR AND SEVENTY SIX PAISE ONLY"
    );
  });

  it("formats line amounts with two decimals and no grouping", () => {
    expect(formatLineAmount(205)).toBe("205.00/-");
    expect(formatLineAmount(35670)).toBe("35670.00/-");
  });

  it("formats summary amounts with Indian grouping", () => {
    expect(formatSummaryAmount(635135)).toBe("₹ 6,35,135/-");
    expect(formatSummaryAmount(15878.38)).toBe("₹ 15,878.38/-");
    expect(formatSummaryAmount(0)).toBe("₹ 0/-");
  });

  it("prints a zero discount without a space", () => {
    expect(formatDiscountAmount(0)).toBe("₹0/-");
  });

  it("uses the contact number, then the receiver mobile", () => {
    expect(
      receiverContactPhone({
        receiver_contact_number: "9429033500",
        receiver_mobile: "9999999999",
      })
    ).toBe("9429033500");
    expect(receiverContactPhone({ receiver_mobile: "9999999999" })).toBe("9999999999");
  });

  it("shows the rupee discount as the gap between line prices and taxable value", () => {
    const bill = {
      total_value: 900,
      total_bill: 945,
      lines: [
        { price: 1000, cgst_amount: 22.5, sgst_amount: 22.5, igst_amount: 0 },
      ],
    };
    const figures = invoiceFigures(bill);
    expect(discountRupees(bill.lines, bill.total_value)).toBe(100);
    expect(figures.discount).toBe(100);
    expect(figures.cgst).toBe(22.5);
    expect(figures.words).toBe("NINE HUNDRED FORTY FIVE INR ONLY");
  });
});
