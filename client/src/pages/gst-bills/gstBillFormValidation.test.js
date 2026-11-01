import { describe, expect, it } from "vitest";

import {
  DUPLICATE_PRODUCT_MESSAGE,
  availableStockForBillLine,
  displayedStockInHand,
  insufficientStockMessage,
  validateGstBillForm,
} from "@/pages/gst-bills/gstBillFormValidation";

const client = {
  mobile: "9999999999",
  name: "Acme",
  gst_number: "27AAAAA0000A1Z5",
};

function validLine(overrides = {}) {
  return {
    bill_line_id: "",
    product_id: "p1",
    tax_code_id: "t1",
    quantity: "1",
    rate: "10.00",
    cgst_percent: 9,
    sgst_percent: 9,
    igst_percent: 18,
    ...overrides,
  };
}

function validForm(overrides = {}) {
  return {
    billNumberParts: ["A", "1", "1"],
    billDate: "2026-11-01",
    receiverMobile: client.mobile,
    lines: [validLine()],
    clients: [client],
    taxShape: "within-state",
    products: [{ product_id: "p1", product_name: "Widget", stock_in_hand: 10 }],
    ...overrides,
  };
}

describe("validateGstBillForm stock and duplicates", () => {
  it("still accepts a complete bill when stock context is omitted", () => {
    const { products, ...withoutCatalog } = validForm();
    const result = validateGstBillForm(withoutCatalog);
    expect(products).toHaveLength(1);
    expect(result.hasError).toBe(false);
  });

  it("refuses the same product on two non-blank lines", () => {
    const result = validateGstBillForm(
      validForm({
        lines: [
          validLine({ product_id: "p1", quantity: "1" }),
          validLine({ product_id: "p1", quantity: "2" }),
          validLine({ product_id: "", tax_code_id: "", quantity: "" }),
        ],
      })
    );

    expect(result.hasError).toBe(true);
    expect(result.errors.lines[0].product).toBe(DUPLICATE_PRODUCT_MESSAGE);
    expect(result.errors.lines[1].product).toBe(DUPLICATE_PRODUCT_MESSAGE);
    expect(result.errors.lines[2].product).toBeNull();
  });

  it("allows the same bill once the extra product line is removed", () => {
    const result = validateGstBillForm(
      validForm({
        lines: [validLine({ quantity: "3" })],
      })
    );

    expect(result.hasError).toBe(false);
    expect(result.errors.lines[0].product).toBeNull();
  });

  it("names the product, the available quantity, and the requested quantity", () => {
    const result = validateGstBillForm(
      validForm({
        lines: [validLine({ quantity: "5" })],
        products: [{ product_id: "p1", product_name: "Widget", stock_in_hand: 3 }],
      })
    );

    expect(result.hasError).toBe(true);
    expect(result.errors.lines[0].quantity).toBe(
      "Insufficient stock for Widget: 3 available, 5 requested."
    );
    expect(result.errors.lines[0].quantity).toBe(insufficientStockMessage("Widget", 3, 5));
  });

  it("allows a quantity equal to stock in hand", () => {
    const result = validateGstBillForm(
      validForm({
        lines: [validLine({ quantity: "3" })],
        products: [{ product_id: "p1", product_name: "Widget", stock_in_hand: 3 }],
      })
    );

    expect(result.hasError).toBe(false);
  });

  it("keeps an unchanged edit within current stock plus the stored quantity", () => {
    const existingLines = [{ bill_line_id: "bl1", product_id: "p1", quantity: 2 }];
    const line = validLine({ bill_line_id: "bl1", quantity: "4" });
    const products = [{ product_id: "p1", product_name: "Widget", stock_in_hand: 1 }];
    const context = {
      products,
      isEdit: true,
      stockApplied: true,
      existingLines,
    };

    expect(displayedStockInHand(line, context)).toBe(1);
    expect(availableStockForBillLine(line, context)).toBe(3);

    const over = validateGstBillForm(
      validForm({
        ...context,
        lines: [line],
      })
    );
    expect(over.hasError).toBe(true);
    expect(over.errors.lines[0].quantity).toBe(
      "Insufficient stock for Widget: 3 available, 4 requested."
    );

    const kept = validateGstBillForm(
      validForm({
        ...context,
        lines: [validLine({ bill_line_id: "bl1", quantity: "3" })],
      })
    );
    expect(kept.hasError).toBe(false);
  });

  it("uses the new product's current stock when the line product changed", () => {
    const line = validLine({ bill_line_id: "bl1", product_id: "p2", quantity: "4" });
    const context = {
      isEdit: true,
      stockApplied: true,
      existingLines: [{ bill_line_id: "bl1", product_id: "p1", quantity: 10 }],
      products: [
        { product_id: "p1", product_name: "Widget", stock_in_hand: 0 },
        { product_id: "p2", product_name: "Gadget", stock_in_hand: 3 },
      ],
    };

    expect(displayedStockInHand(line, context)).toBe(3);
    expect(availableStockForBillLine(line, context)).toBe(3);

    const result = validateGstBillForm(
      validForm({
        ...context,
        lines: [line],
      })
    );

    expect(result.hasError).toBe(true);
    expect(result.errors.lines[0].quantity).toBe(
      "Insufficient stock for Gadget: 3 available, 4 requested."
    );
  });

  it("shows current stock in hand while an unchanged edit may still keep its stored quantity", () => {
    const line = validLine({ bill_line_id: "bl1", quantity: "5" });
    const context = {
      products: [{ product_id: "p1", product_name: "Widget", stock_in_hand: 0 }],
      isEdit: true,
      stockApplied: true,
      existingLines: [{ bill_line_id: "bl1", product_id: "p1", quantity: 5 }],
    };

    expect(displayedStockInHand(line, context)).toBe(0);
    expect(availableStockForBillLine(line, context)).toBe(5);
    expect(displayedStockInHand(validLine({ product_id: "" }), context)).toBeNull();

    const kept = validateGstBillForm(
      validForm({
        ...context,
        lines: [line],
      })
    );
    expect(kept.hasError).toBe(false);

    const over = validateGstBillForm(
      validForm({
        ...context,
        lines: [validLine({ bill_line_id: "bl1", quantity: "6" })],
      })
    );
    expect(over.hasError).toBe(true);
    expect(over.errors.lines[0].quantity).toBe(
      "Insufficient stock for Widget: 5 available, 6 requested."
    );
  });

  it("does not add the stored quantity on a legacy bill", () => {
    const line = validLine({ bill_line_id: "bl1", quantity: "5" });
    const context = {
      products: [{ product_id: "p1", product_name: "Widget", stock_in_hand: 1 }],
      isEdit: true,
      stockApplied: false,
      existingLines: [{ bill_line_id: "bl1", product_id: "p1", quantity: 5 }],
    };

    expect(displayedStockInHand(line, context)).toBe(1);
    expect(availableStockForBillLine(line, context)).toBe(1);

    const result = validateGstBillForm(
      validForm({
        ...context,
        lines: [line],
      })
    );
    expect(result.hasError).toBe(true);
    expect(result.errors.lines[0].quantity).toBe(
      "Insufficient stock for Widget: 1 available, 5 requested."
    );
  });

  it("leaves a stored product missing from the catalog to the server", () => {
    const line = validLine({ bill_line_id: "bl1", product_id: "gone", quantity: "9" });
    const context = {
      products: [{ product_id: "p1", product_name: "Widget", stock_in_hand: 0 }],
      isEdit: true,
      stockApplied: true,
      existingLines: [{ bill_line_id: "bl1", product_id: "gone", quantity: 2 }],
    };

    expect(displayedStockInHand(line, context)).toBeNull();
    expect(availableStockForBillLine(line, context)).toBeNull();

    const result = validateGstBillForm(
      validForm({
        ...context,
        lines: [line],
      })
    );
    expect(result.hasError).toBe(false);
    expect(result.errors.lines[0].quantity).toBeNull();
    expect(result.errors.lines[0].product).toBeNull();
  });
});
