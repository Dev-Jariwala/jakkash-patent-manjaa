import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBill,
  listBills,
  previewBillTotals,
  computeLineFinancials,
} from "../services/bill.js";
import {
  BillDuplicateNumberError,
  BillValidationError,
} from "../services/billErrors.js";
import {
  createBillWorld,
  standardBillPayload,
} from "./helpers/billWorld.mjs";

describe("createBill", () => {
  it("saves the 200 at 220 within-state bill with total bill 46200", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const saved = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    assert.equal(saved.bill_number, "9-26-15");
    assert.equal(saved.total_value, 44000);
    assert.equal(saved.total_tax, 2200);
    assert.equal(saved.total_bill, 46200);
    assert.equal(saved.lines.length, 1);
    const line = saved.lines[0];
    assert.equal(line.price, 44000);
    assert.equal(line.cgst_amount, 1100);
    assert.equal(line.sgst_amount, 1100);
    assert.equal(line.igst_amount, 0);
    assert.equal(line.line_total, 46200);
    assert.equal(line.product_name, product.product_name);
    assert.equal(line.tax_code, taxCode.code);
    assert.equal(line.tax_code_description, taxCode.description);
    assert.equal(saved.bank_name, "HDFC Bank");
    assert.equal(saved.receiver_name, client.name);
  });

  it("saves a 10% discount on two lines with totals 39600, 2448, and 42048", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const productA = world.seedProduct(collectionId, { wholesale_price: 200 });
    const productB = world.seedProduct(collectionId, {
      product_name: "Lining",
      wholesale_price: 40,
    });
    const taxLow = world.seedTaxCode();
    const taxHigh = world.seedTaxCode({
      code: "5407",
      cgst: 9,
      sgst: 9,
      igst: 18,
    });

    const saved = await createBill(world.deps, collectionId, {
      bill_number_parts: ["1", "2", "3"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      discount_percent: 10,
      lines: [
        {
          product_id: productA.product_id,
          tax_code_id: taxLow.tax_code_id,
          quantity: 200,
          rate: 200,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
        {
          product_id: productB.product_id,
          tax_code_id: taxHigh.tax_code_id,
          quantity: 100,
          rate: 40,
          cgst_percent: 9,
          sgst_percent: 9,
          igst_percent: 0,
        },
      ],
    });

    assert.equal(saved.lines[0].price, 40000);
    assert.equal(saved.lines[1].price, 4000);
    assert.equal(saved.total_value, 39600);
    assert.equal(saved.total_tax, 2448);
    assert.equal(saved.total_bill, 42048);
  });

  it("rounds each rupee half up to the paise on a discounted line", async () => {
    const financials = computeLineFinancials({
      quantity: 1,
      rate: 10.05,
      discountPercent: 10,
      cgstPercent: 2.5,
      sgstPercent: 2.5,
      igstPercent: 0,
    });
    assert.equal(financials.discounted_price, 9.05);
    assert.equal(financials.cgst_amount, 0.23);
    assert.equal(financials.sgst_amount, 0.23);
    assert.equal(financials.line_total, 9.51);
  });

  it("accepts IGST-only and exempt tax shapes and rejects mixed or unequal CGST and SGST", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      bill_number_parts: ["1", "1", "1"],
      lines: [
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 5,
        },
      ],
    });

    await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      bill_number_parts: ["1", "1", "2"],
      lines: [
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 0,
        },
      ],
    });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          bill_number_parts: ["1", "1", "3"],
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 5,
            },
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillValidationError);
        return true;
      }
    );

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          bill_number_parts: ["1", "1", "4"],
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 9,
              igst_percent: 0,
            },
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillValidationError);
        return true;
      }
    );
  });

  it("rejects bill number, receiver, and bank problems with a clear message", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();
    const base = standardBillPayload({ world, collectionId, product, taxCode, client });

    await assert.rejects(
      () => createBill(world.deps, collectionId, { ...base, bill_number_parts: ["9", "26"] }),
      /three parts/
    );
    await assert.rejects(
      () => createBill(world.deps, collectionId, { ...base, bill_number_parts: ["9-26", "15", "1"] }),
      /hyphen/
    );

    await createBill(world.deps, collectionId, base);
    await assert.rejects(
      () => createBill(world.deps, collectionId, { ...base, bill_number_parts: ["9", "26", "15"] }),
      (error) => {
        assert.ok(error instanceof BillDuplicateNumberError);
        return true;
      }
    );

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...base,
          bill_number_parts: ["2", "2", "2"],
          receiver_mobile: "",
        }),
      /Receiver is required/
    );

    world.seedClient({ mobile: "9000000001", gst_number: null });
    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...base,
          bill_number_parts: ["2", "2", "2"],
          receiver_mobile: "9000000001",
        }),
      /GST number/
    );

    world.setShopBankAccount(null);
    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...base,
          bill_number_parts: ["3", "3", "3"],
        }),
      /Save Bank details first/
    );
  });

  it("drops a blank line, rejects a half-filled line, and allows the same product twice", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const saved = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      bill_number_parts: ["4", "4", "4"],
      lines: [
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 10,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
        {},
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 10,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });
    assert.equal(saved.lines.length, 2);

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          bill_number_parts: ["5", "5", "5"],
          lines: [{ product_id: product.product_id }],
        }),
      /Each line needs/
    );
  });

  it("saves through the bill module without stock or order writers on the seam", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );
    assert.equal(world.getBillSaveCount(), 1);
    assert.equal(typeof world.deps.insertBill, "function");
    assert.equal(world.deps.updateStock, undefined);
    assert.equal(world.deps.createOrder, undefined);
  });
});

describe("listBills", () => {
  it("returns only one collection's bills newest date first and later save first on a tie", async () => {
    const world = createBillWorld();
    const collectionA = world.seedCollection();
    const collectionB = world.seedCollection();
    const client = world.seedClient();
    const productA = world.seedProduct(collectionA);
    const productB = world.seedProduct(collectionB);
    const taxCode = world.seedTaxCode();

    await createBill(world.deps, collectionA, {
      ...standardBillPayload({
        world,
        collectionId: collectionA,
        product: productA,
        taxCode,
        client,
      }),
      bill_number_parts: ["1", "0", "1"],
      bill_date: "2026-10-10",
    });
    await createBill(world.deps, collectionA, {
      ...standardBillPayload({
        world,
        collectionId: collectionA,
        product: productA,
        taxCode,
        client,
      }),
      bill_number_parts: ["1", "0", "2"],
      bill_date: "2026-10-11",
    });
    await createBill(world.deps, collectionB, {
      ...standardBillPayload({
        world,
        collectionId: collectionB,
        product: productB,
        taxCode,
        client,
      }),
      bill_number_parts: ["9", "9", "9"],
    });

    const listA = await listBills(world.deps, collectionA);
    assert.equal(listA.length, 2);
    assert.equal(listA[0].bill_number, "1-0-2");
    assert.equal(listA[1].bill_number, "1-0-1");

    const listB = await listBills(world.deps, collectionB);
    assert.equal(listB.length, 1);
    assert.equal(listB[0].bill_number, "9-9-9");
  });
});

describe("previewBillTotals", () => {
  it("matches footer math for the operator form", () => {
    const totals = previewBillTotals({
      discount_percent: 0,
      lines: [
        {
          product_id: "p1",
          tax_code_id: "t1",
          quantity: 200,
          rate: 220,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });
    assert.equal(totals.total_bill, 46200);
  });

  it("ignores blank and incomplete lines without failing the footer", () => {
    const totals = previewBillTotals({
      discount_percent: 0,
      lines: [
        {},
        { product_id: "p1" },
        {
          product_id: "p1",
          tax_code_id: "t1",
          quantity: 200,
          rate: 220,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });
    assert.equal(totals.total_bill, 46200);
    assert.equal(totals.line_previews[0], null);
    assert.equal(totals.line_previews[1], null);
    assert.equal(totals.line_previews[2].line_total, 46200);
  });

  it("returns zero footer totals when no line is complete yet", () => {
    const totals = previewBillTotals({
      discount_percent: 0,
      lines: [{}, { product_id: "p1", tax_code_id: "t1" }],
    });
    assert.equal(totals.total_value, 0);
    assert.equal(totals.total_tax, 0);
    assert.equal(totals.total_bill, 0);
  });

  it("ignores a line that has product, tax code, and quantity but no rate yet", () => {
    const totals = previewBillTotals({
      discount_percent: 0,
      lines: [
        {
          product_id: "p1",
          tax_code_id: "t1",
          quantity: 10,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });
    assert.equal(totals.total_bill, 0);
    assert.equal(totals.line_previews[0], null);
  });
});

describe("createBill rate required", () => {
  it("rejects a kept line with no rate instead of treating it as zero", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          bill_number_parts: ["7", "7", "7"],
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 10,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 0,
            },
          ],
        }),
      /Rate is required/
    );
  });
});
