import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { BillInsufficientStockError } from "../services/billErrors.js";
import { createBillDeps } from "../services/billStore.js";
import { __setQueryImplementationForTests } from "../utils/query.js";

describe("billStore stock guard", () => {
  afterEach(() => {
    __setQueryImplementationForTests(null);
  });

  it("throws BillInsufficientStockError when the guarded stock update affects zero rows", async () => {
    let durableBillWrites = 0;

    __setQueryImplementationForTests(async (sql) => {
      const text = sql.replace(/\s+/g, " ").trim().toLowerCase();
      if (text.startsWith("insert into gst_bills")) {
        durableBillWrites += 1;
        return [];
      }
      if (text.startsWith("insert into gst_bill_lines")) {
        return [];
      }
      if (text.includes("stock_in_hand = stock_in_hand -")) {
        durableBillWrites = 0;
        return [];
      }
      return [];
    });

    const deps = createBillDeps();
    const billRow = {
      bill_id: "bill-1",
      collection_id: "col-1",
      bill_number: "1-2-3",
      bill_date: "2026-10-11",
      receiver_mobile: "9876543210",
      receiver_name: "Acme",
      receiver_address: "Addr",
      receiver_gst_number: "24AABCU9603R1ZM",
      receiver_contact_person: null,
      receiver_contact_number: null,
      total_value: 100,
      total_tax: 5,
      total_bill: 105,
      tax_shape: "within-state",
      bank_name: "Bank",
      bank_address: "Addr",
      bank_account_number: "123",
      bank_ifsc: "IFSC0001",
      saved_at: new Date().toISOString(),
      stock_applied: true,
    };
    const lineRows = [
      {
        bill_line_id: "line-1",
        bill_id: "bill-1",
        line_order: 0,
        product_id: "prod-1",
        product_name: "Fabric",
        tax_code_id: "tax-1",
        tax_code: "5209",
        tax_code_description: "Cotton",
        quantity: 5,
        rate: 100,
        price: 500,
        cgst_percent: 2.5,
        sgst_percent: 2.5,
        igst_percent: 5,
        cgst_amount: 12.5,
        sgst_amount: 12.5,
        igst_amount: 0,
        tax_rates_are_copy: true,
        line_total: 525,
      },
    ];
    const stockDeltas = [
      {
        product_id: "prod-1",
        delta: 5,
        product_name: "Fabric",
        available: 0,
      },
    ];

    await assert.rejects(
      () => deps.insertBill(billRow, lineRows, stockDeltas),
      (error) => {
        assert.ok(error instanceof BillInsufficientStockError);
        assert.equal(error.code, "BILL_INSUFFICIENT_STOCK");
        return true;
      }
    );

    assert.equal(durableBillWrites, 0);
  });
});
