import { describe, expect, it } from "vitest";

import {
  amountInWords,
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

  it("uses the contact number, then the receiver mobile", () => {
    expect(
      receiverContactPhone({
        receiver_contact_number: "9429033500",
        receiver_mobile: "9999999999",
      })
    ).toBe("9429033500");
    expect(receiverContactPhone({ receiver_mobile: "9999999999" })).toBe("9999999999");
  });

  it("sets Total Taxable Value to total value and Final Amount to total bill", () => {
    const bill = {
      total_value: 44000,
      total_bill: 46200,
      lines: [
        { price: 44000, cgst_amount: 1100, sgst_amount: 1100, igst_amount: 0 },
      ],
    };
    const figures = invoiceFigures(bill);
    expect(figures.taxable).toBe(44000);
    expect(figures.finalAmount).toBe(46200);
    expect(figures.cgst).toBe(1100);
    expect(figures.words).toBe("FORTY SIX THOUSAND TWO HUNDRED INR ONLY");
  });
});
