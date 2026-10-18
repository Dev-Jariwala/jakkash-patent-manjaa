import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createBill,
  getBill,
  listBills,
  previewBillTotals,
  updateBill,
} from "../services/bill.js";
import {
  BillDuplicateNumberError,
  BillValidationError,
} from "../services/billErrors.js";
import {
  createBillWorld,
  standardBillPayload,
  updatePayloadFromBill,
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

  it("copies the product tax code and description on create", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({
      code: "520910",
      description: "Cotton yarn, unbleached",
    });
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const saved = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    assert.equal(saved.lines[0].tax_code, "520910");
    assert.equal(saved.lines[0].tax_code_description, "Cotton yarn, unbleached");
  });

  it("rejects a create when the submitted tax code does not match the product", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxOnProduct = world.seedTaxCode({ code: "1111" });
    const otherTax = world.seedTaxCode({ code: "2222" });
    const product = world.seedProduct(collectionId, { tax_code_id: taxOnProduct.tax_code_id });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({
            world,
            collectionId,
            product,
            taxCode: taxOnProduct,
            client,
          }),
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: otherTax.tax_code_id,
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 0,
            },
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillValidationError);
        assert.match(error.message, /match the product's HSN\/SAC/);
        return true;
      }
    );
  });

  it("rejects a create when the product has no HSN/SAC", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: null });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          bill_number_parts: ["4", "4", "4"],
          bill_date: "2026-10-11",
          receiver_mobile: client.mobile,
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 0,
            },
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillValidationError);
        assert.match(error.message, /no HSN\/SAC/);
        return true;
      }
    );
  });

  it("stores submitted percents on create even when they differ from the tax code defaults", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ cgst: 2.5, sgst: 2.5, igst: 5 });
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const saved = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      bill_number_parts: ["3", "3", "3"],
      lines: [
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 100,
          rate: 10,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 5,
        },
      ],
    });

    assert.equal(saved.lines[0].cgst_percent, 0);
    assert.equal(saved.lines[0].sgst_percent, 0);
    assert.equal(saved.lines[0].igst_percent, 5);
  });

  it("saves two lines taxed on the full price with totals 44000, 2720, and 46720", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxLow = world.seedTaxCode();
    const taxHigh = world.seedTaxCode({
      code: "5407",
      cgst: 9,
      sgst: 9,
      igst: 18,
    });
    const productA = world.seedProduct(collectionId, {
      wholesale_price: 200,
      tax_code_id: taxLow.tax_code_id,
    });
    const productB = world.seedProduct(collectionId, {
      product_name: "Lining",
      wholesale_price: 40,
      tax_code_id: taxHigh.tax_code_id,
    });

    const saved = await createBill(world.deps, collectionId, {
      bill_number_parts: ["1", "2", "3"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
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
    assert.equal(saved.total_value, 44000);
    assert.equal(saved.total_tax, 2720);
    assert.equal(saved.total_bill, 46720);
  });

  it("rounds each tax rupee half up to the paise on the full price", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const saved = await createBill(world.deps, collectionId, {
      bill_number_parts: ["1", "0", "9"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      lines: [
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 10.2,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });

    assert.equal(saved.lines[0].cgst_amount, 0.26);
    assert.equal(saved.lines[0].sgst_amount, 0.26);
    assert.equal(saved.total_bill, 10.72);
  });

  it("saves a rate of 0 beside a line that makes the Total bill greater than 0", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const productA = world.seedProduct(collectionId, {
      product_name: "Free sample",
      tax_code_id: taxCode.tax_code_id,
    });
    const productB = world.seedProduct(collectionId, {
      product_name: "Paid line",
      tax_code_id: taxCode.tax_code_id,
    });

    const saved = await createBill(world.deps, collectionId, {
      bill_number_parts: ["1", "1", "0"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      lines: [
        {
          product_id: productA.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 0,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
        {
          product_id: productB.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });

    assert.equal(saved.lines[0].price, 0);
    assert.equal(saved.total_bill, 105);
  });

  it("rejects a create whose kept lines add up to a Total bill of 0", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          bill_number_parts: ["0", "0", "1"],
          bill_date: "2026-10-11",
          receiver_mobile: client.mobile,
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 0,
              cgst_percent: 0,
              sgst_percent: 0,
              igst_percent: 0,
            },
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillValidationError);
        assert.match(error.message, /Total bill must be greater than 0/);
        return true;
      }
    );
  });

  it("rejects a create, update, and preview that send a discount", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const rejectDiscount = (error) => {
      assert.ok(error instanceof BillValidationError);
      assert.match(error.message, /Discount/);
      return true;
    };

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          discount_percent: 0,
        }),
      rejectDiscount
    );

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, created.bill_id, {
          ...updatePayloadFromBill(created),
          discount_percent: 5,
        }),
      rejectDiscount
    );

    assert.throws(
      () =>
        previewBillTotals({
          discount_percent: 0,
          lines: [
            {
              product_id: "p1",
              tax_code_id: "t1",
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 0,
            },
          ],
        }),
      rejectDiscount
    );
  });

  it("reads a saved bill with no discount percent and no reduced price on the line", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    const read = await getBill(world.deps, collectionId, created.bill_id);
    assert.equal(read.discount_percent, undefined);
    assert.equal(read.lines[0].discounted_price, undefined);
    assert.equal(read.lines[0].price, 44000);
    assert.equal(read.total_bill, 46200);
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
      lines: [{}, { product_id: "p1", tax_code_id: "t1" }],
    });
    assert.equal(totals.total_value, 0);
    assert.equal(totals.total_tax, 0);
    assert.equal(totals.total_bill, 0);
  });

  it("ignores a line that has product, tax code, and quantity but no rate yet", () => {
    const totals = previewBillTotals({
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

describe("updateBill", () => {
  it("keeps an unchanged receiver copy after the client is renamed and loses GST", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    world.seedClient({
      mobile: client.mobile,
      name: "Renamed Fabrics",
      gst_number: null,
    });

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, {
        lines: [
          {
            bill_line_id: created.lines[0].bill_line_id,
            product_id: product.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 200,
            rate: 215,
            cgst_percent: 2.5,
            sgst_percent: 2.5,
            igst_percent: 0,
          },
        ],
      })
    );

    assert.equal(updated.receiver_name, "Acme Fabrics");
    assert.equal(updated.receiver_gst_number, "24AABCU9603R1ZM");
    assert.equal(updated.lines[0].rate, 215);
  });

  it("replaces the receiver copy when a different client is chosen", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const clientA = world.seedClient();
    const clientB = world.seedClient({
      mobile: "9000000099",
      name: "Beta Textiles",
      address: "Station Road",
      gst_number: "24AAAAA0000A1Z5",
    });
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client: clientA })
    );

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, { receiver_mobile: clientB.mobile })
    );

    assert.equal(updated.receiver_name, "Beta Textiles");
    assert.equal(updated.receiver_address, "Station Road");
    assert.equal(updated.receiver_mobile, clientB.mobile);
  });

  it("keeps stored product name and tax-code description when ids stay the same", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    world.seedProduct(collectionId, {
      product_id: product.product_id,
      product_name: "Renamed cotton",
      wholesale_price: 999,
    });
    world.seedTaxCode({
      tax_code_id: taxCode.tax_code_id,
      description: "New catalog wording",
      code: "9999",
    });

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, {
        lines: [
          {
            bill_line_id: created.lines[0].bill_line_id,
            product_id: product.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 200,
            rate: 225,
            cgst_percent: 3,
            sgst_percent: 3,
            igst_percent: 0,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].product_name, "Cotton fabric");
    assert.equal(updated.lines[0].tax_code, "5209");
    assert.equal(updated.lines[0].tax_code_description, "Woven fabrics of cotton");
    assert.equal(updated.lines[0].rate, 225);
    assert.equal(updated.lines[0].cgst_percent, 3);
  });

  it("keeps the copied tax code when the product is retargeted and the line is untouched", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxOld = world.seedTaxCode({ code: "520910", description: "Old HSN wording" });
    const taxNew = world.seedTaxCode({ code: "520911", description: "New HSN" });
    const product = world.seedProduct(collectionId, { tax_code_id: taxOld.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product,
        taxCode: taxOld,
        client,
        overrides: { bill_number_parts: ["5", "2", "0"] },
      })
    );

    world.seedProduct(collectionId, {
      product_id: product.product_id,
      tax_code_id: taxNew.tax_code_id,
    });

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, {
        lines: [
          {
            bill_line_id: created.lines[0].bill_line_id,
            product_id: product.product_id,
            tax_code_id: taxOld.tax_code_id,
            quantity: 200,
            rate: 220,
            cgst_percent: 2.5,
            sgst_percent: 2.5,
            igst_percent: 0,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].tax_code_id, taxOld.tax_code_id);
    assert.equal(updated.lines[0].tax_code, "520910");
    assert.equal(updated.lines[0].tax_code_description, "Old HSN wording");
  });

  it("rejects a different tax code on an untouched line", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxOnLine = world.seedTaxCode({ code: "520910" });
    const otherTax = world.seedTaxCode({ code: "9999" });
    const product = world.seedProduct(collectionId, { tax_code_id: taxOnLine.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product,
        taxCode: taxOnLine,
        client,
        overrides: { bill_number_parts: ["5", "2", "1"] },
      })
    );

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, created.bill_id, {
          ...updatePayloadFromBill(created),
          lines: [
            {
              bill_line_id: created.lines[0].bill_line_id,
              product_id: product.product_id,
              tax_code_id: otherTax.tax_code_id,
              quantity: 200,
              rate: 220,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 0,
            },
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillValidationError);
        assert.match(error.message, /chosen again/);
        return true;
      }
    );
  });

  it("copies the product's current tax code when the product is chosen again", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxOld = world.seedTaxCode({ code: "520910", description: "Was on the bill" });
    const taxNew = world.seedTaxCode({
      code: "520911",
      description: "Now on Cotton",
      cgst: 6,
      sgst: 6,
      igst: 12,
    });
    const product = world.seedProduct(collectionId, { tax_code_id: taxOld.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product,
        taxCode: taxOld,
        client,
        overrides: { bill_number_parts: ["5", "2", "2"] },
      })
    );

    world.seedProduct(collectionId, {
      product_id: product.product_id,
      tax_code_id: taxNew.tax_code_id,
    });

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, {
        lines: [
          {
            bill_line_id: created.lines[0].bill_line_id,
            product_id: product.product_id,
            tax_code_id: taxNew.tax_code_id,
            quantity: 200,
            rate: 220,
            cgst_percent: 6,
            sgst_percent: 6,
            igst_percent: 0,
            product_chosen_again: true,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].tax_code, "520911");
    assert.equal(updated.lines[0].tax_code_description, "Now on Cotton");
    assert.equal(updated.lines[0].cgst_percent, 6);
  });

  it("copies new digits on the same Masters row when the product is chosen again", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ code: "520910", description: "Cotton yarn" });
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product,
        taxCode,
        client,
        overrides: { bill_number_parts: ["5", "2", "3"] },
      })
    );

    world.seedTaxCode({
      tax_code_id: taxCode.tax_code_id,
      code: "520912",
      description: "Revised cotton yarn",
    });

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, {
        lines: [
          {
            bill_line_id: created.lines[0].bill_line_id,
            product_id: product.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 200,
            rate: 220,
            cgst_percent: 2.5,
            sgst_percent: 2.5,
            igst_percent: 0,
            product_chosen_again: true,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].tax_code, "520912");
    assert.equal(updated.lines[0].tax_code_description, "Revised cotton yarn");
  });

  it("keeps a copied tax code when the product no longer has one and the line is untouched", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ code: "520910", description: "Legacy copy" });
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product,
        taxCode,
        client,
        overrides: { bill_number_parts: ["5", "2", "4"] },
      })
    );

    world.seedProduct(collectionId, {
      product_id: product.product_id,
      tax_code_id: null,
    });

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created)
    );

    assert.equal(updated.lines[0].tax_code, "520910");
    assert.equal(updated.lines[0].tax_code_description, "Legacy copy");
  });

  it("reads a saved bill with the copied tax code, not the product's current tax code", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxOnBill = world.seedTaxCode({ code: "520910" });
    const taxOnProductNow = world.seedTaxCode({ code: "520911" });
    const product = world.seedProduct(collectionId, { tax_code_id: taxOnBill.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product,
        taxCode: taxOnBill,
        client,
        overrides: { bill_number_parts: ["5", "2", "5"] },
      })
    );

    world.seedProduct(collectionId, {
      product_id: product.product_id,
      tax_code_id: taxOnProductNow.tax_code_id,
    });
    world.seedTaxCode({
      tax_code_id: taxOnBill.tax_code_id,
      code: "999999",
      description: "Masters edit",
    });

    const read = await getBill(world.deps, collectionId, created.bill_id);
    assert.equal(read.lines[0].tax_code, "520910");
    assert.equal(read.lines[0].cgst_percent, 2.5);
  });

  it("copies fresh product and tax-code fields when those ids change", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxA = world.seedTaxCode({ code: "1111", description: "Tax A" });
    const taxB = world.seedTaxCode({
      code: "2222",
      description: "Tax B",
      cgst: 9,
      sgst: 9,
      igst: 18,
    });
    const productA = world.seedProduct(collectionId, {
      product_name: "Fabric A",
      tax_code_id: taxA.tax_code_id,
    });
    const productB = world.seedProduct(collectionId, {
      product_name: "Fabric B",
      wholesale_price: 50,
      tax_code_id: taxB.tax_code_id,
    });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product: productA,
        taxCode: taxA,
        client,
        overrides: { bill_number_parts: ["8", "8", "8"] },
      })
    );

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, {
        lines: [
          {
            bill_line_id: created.lines[0].bill_line_id,
            product_id: productB.product_id,
            tax_code_id: taxB.tax_code_id,
            quantity: 10,
            rate: 50,
            cgst_percent: 9,
            sgst_percent: 9,
            igst_percent: 0,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].product_name, "Fabric B");
    assert.equal(updated.lines[0].tax_code, "2222");
    assert.equal(updated.lines[0].tax_code_description, "Tax B");
  });

  it("leaves the bank block alone after the shop account changes", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    world.setShopBankAccount({
      bank_name: "ICICI Bank",
      bank_address: "New address",
      account_number: "999",
      ifsc: "ICIC0000999",
      updated_at: new Date().toISOString(),
    });

    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created)
    );

    assert.equal(updated.bank_name, "HDFC Bank");
    assert.equal(updated.bank_account_number, "012345678");
  });

  it("accepts this bill's own number and rejects another bill's number", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const first = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );
    await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      bill_number_parts: ["1", "0", "0"],
    });

    await updateBill(
      world.deps,
      collectionId,
      first.bill_id,
      updatePayloadFromBill(first)
    );

    await assert.rejects(
      () =>
        updateBill(
          world.deps,
          collectionId,
          first.bill_id,
          updatePayloadFromBill(first, { bill_number_parts: ["1", "0", "0"] })
        ),
      (error) => {
        assert.ok(error instanceof BillDuplicateNumberError);
        return true;
      }
    );
  });

  it("drops a removed line, saves a new line, and keeps submitted order", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const productA = world.seedProduct(collectionId, {
      product_name: "Line A",
      tax_code_id: taxCode.tax_code_id,
    });
    const productB = world.seedProduct(collectionId, {
      product_name: "Line B",
      tax_code_id: taxCode.tax_code_id,
    });
    const productC = world.seedProduct(collectionId, {
      product_name: "Line C",
      tax_code_id: taxCode.tax_code_id,
    });

    const created = await createBill(world.deps, collectionId, {
      ...standardBillPayload({
        world,
        collectionId,
        product: productA,
        taxCode,
        client,
      }),
      bill_number_parts: ["6", "6", "6"],
      lines: [
        {
          product_id: productA.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 10,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
        {
          product_id: productB.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 20,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });

    const lineToKeep = created.lines[1];
    const updated = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      {
        ...updatePayloadFromBill(created),
        lines: [
          {
            bill_line_id: lineToKeep.bill_line_id,
            product_id: productB.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 2,
            rate: 20,
            cgst_percent: 2.5,
            sgst_percent: 2.5,
            igst_percent: 0,
          },
          {
            product_id: productC.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 3,
            rate: 30,
            cgst_percent: 2.5,
            sgst_percent: 2.5,
            igst_percent: 0,
          },
        ],
      }
    );

    assert.equal(updated.lines.length, 2);
    assert.equal(updated.lines[0].product_name, "Line B");
    assert.equal(updated.lines[0].bill_line_id, lineToKeep.bill_line_id);
    assert.equal(updated.lines[1].product_name, "Line C");
    assert.ok(updated.lines[1].bill_line_id);
  });

  it("reads a saved bill for the collection that raised it", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const otherCollection = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    const read = await getBill(world.deps, collectionId, created.bill_id);
    assert.equal(read.bill_number_parts.join("-"), created.bill_number);
    assert.equal(read.lines[0].bill_line_id, created.lines[0].bill_line_id);

    await assert.rejects(
      () => getBill(world.deps, otherCollection, created.bill_id),
      (error) => {
        assert.equal(error.name, "BillNotFoundError");
        return true;
      }
    );
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
