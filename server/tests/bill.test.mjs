import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  TAX_SHAPE_INTERSTATE,
  TAX_SHAPE_WITHIN_STATE,
  createBill,
  getBill,
  inferLegacyBillSharedShape,
  listBills,
  previewBillTotals,
  updateBill,
} from "../services/bill.js";
import {
  BillDuplicateNumberError,
  BillValidationError,
} from "../services/billErrors.js";
import {
  copyTrioPercentsFromTaxCode,
  createBillWorld,
  insertLegacyBill,
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
    assert.equal(line.igst_percent, 5);
    assert.equal(saved.tax_shape, TAX_SHAPE_WITHIN_STATE);
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
              ...copyTrioPercentsFromTaxCode(otherTax),
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
          tax_shape: TAX_SHAPE_WITHIN_STATE,
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 100,
              ...copyTrioPercentsFromTaxCode(taxCode),
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

  it("stores a legal copied trio on create even when it differs from the tax code defaults", async () => {
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
          cgst_percent: 3,
          sgst_percent: 3,
          igst_percent: 6,
        },
      ],
    });

    assert.equal(saved.lines[0].cgst_percent, 3);
    assert.equal(saved.lines[0].sgst_percent, 3);
    assert.equal(saved.lines[0].igst_percent, 6);
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
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          product_id: productA.product_id,
          tax_code_id: taxLow.tax_code_id,
          quantity: 200,
          rate: 200,
          ...copyTrioPercentsFromTaxCode(taxLow),
        },
        {
          product_id: productB.product_id,
          tax_code_id: taxHigh.tax_code_id,
          quantity: 100,
          rate: 40,
          ...copyTrioPercentsFromTaxCode(taxHigh),
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
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 10.2,
          ...copyTrioPercentsFromTaxCode(taxCode),
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
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          product_id: productA.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 0,
          ...copyTrioPercentsFromTaxCode(taxCode),
        },
        {
          product_id: productB.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
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
          tax_shape: TAX_SHAPE_WITHIN_STATE,
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
          tax_shape: TAX_SHAPE_WITHIN_STATE,
          lines: [
            {
              product_id: "p1",
              tax_code_id: "t1",
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 5,
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

  it("accepts interstate and exempt copied trios and rejects illegal copies", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();

    await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      tax_shape: TAX_SHAPE_INTERSTATE,
      bill_number_parts: ["1", "1", "1"],
      lines: [
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
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
              igst_percent: 0,
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
              sgst_percent: 2.5,
              igst_percent: 6,
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
          bill_number_parts: ["1", "1", "5"],
          lines: [
            {
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 9,
              igst_percent: 11.5,
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
          ...copyTrioPercentsFromTaxCode(taxCode),
        },
        {},
        {
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 10,
          ...copyTrioPercentsFromTaxCode(taxCode),
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

    const listA = await listBills(world.deps, collectionA, { page: 1, limit: 10 });
    assert.equal(listA.bills.length, 2);
    assert.equal(listA.bills[0].bill_number, "1-0-2");
    assert.equal(listA.bills[1].bill_number, "1-0-1");
    assert.equal(listA.pagination.page, 1);
    assert.equal(listA.pagination.totalItems, 2);

    const page2 = await listBills(world.deps, collectionA, { page: 2, limit: 1 });
    assert.equal(page2.bills.length, 1);
    assert.equal(page2.bills[0].bill_number, "1-0-1");
    assert.equal(page2.pagination.page, 2);
    assert.equal(page2.pagination.limit, 1);
    assert.equal(page2.pagination.totalItems, 2);
    assert.equal(page2.pagination.totalPages, 2);

    const listB = await listBills(world.deps, collectionB, { page: 1, limit: 10 });
    assert.equal(listB.bills.length, 1);
    assert.equal(listB.bills[0].bill_number, "9-9-9");
  });

  it("matches a bill number or receiver name and stays inside the collection", async () => {
    const world = createBillWorld();
    const collectionA = world.seedCollection();
    const collectionB = world.seedCollection();
    const acme = world.seedClient({ mobile: "9000000001", name: "Acme Fabrics" });
    const beta = world.seedClient({ mobile: "9000000002", name: "Beta Textiles" });
    const productA = world.seedProduct(collectionA);
    const productB = world.seedProduct(collectionB);
    const taxCode = world.seedTaxCode();

    await createBill(world.deps, collectionA, {
      ...standardBillPayload({
        world,
        collectionId: collectionA,
        product: productA,
        taxCode,
        client: acme,
      }),
      bill_number_parts: ["1", "0", "1"],
    });
    await createBill(world.deps, collectionA, {
      ...standardBillPayload({
        world,
        collectionId: collectionA,
        product: productA,
        taxCode,
        client: beta,
      }),
      bill_number_parts: ["1", "0", "2"],
    });
    await createBill(world.deps, collectionB, {
      ...standardBillPayload({
        world,
        collectionId: collectionB,
        product: productB,
        taxCode,
        client: beta,
      }),
      bill_number_parts: ["9", "9", "9"],
    });

    const byName = await listBills(world.deps, collectionA, { search: "beta" });
    assert.equal(byName.bills.length, 1);
    assert.equal(byName.bills[0].bill_number, "1-0-2");
    assert.equal(byName.bills[0].receiver_name, "Beta Textiles");
    assert.equal(byName.pagination.totalItems, 1);

    const byNumber = await listBills(world.deps, collectionA, { search: "1-0-1" });
    assert.equal(byNumber.bills.length, 1);
    assert.equal(byNumber.bills[0].bill_number, "1-0-1");
    assert.equal(byNumber.bills[0].receiver_name, "Acme Fabrics");

    const otherCollection = await listBills(world.deps, collectionA, { search: "9-9-9" });
    assert.equal(otherCollection.bills.length, 0);
    assert.equal(otherCollection.pagination.totalItems, 0);
  });
});

describe("previewBillTotals", () => {
  it("matches footer math for the operator form", () => {
    const totals = previewBillTotals({
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          product_id: "p1",
          tax_code_id: "t1",
          quantity: 200,
          rate: 220,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
        },
      ],
    });
    assert.equal(totals.total_bill, 46200);
  });

  it("ignores blank and incomplete lines without failing the footer", () => {
    const totals = previewBillTotals({
      tax_shape: TAX_SHAPE_WITHIN_STATE,
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
          igst_percent: 5,
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
            cgst_percent: created.lines[0].cgst_percent,
            sgst_percent: created.lines[0].sgst_percent,
            igst_percent: created.lines[0].igst_percent,
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
            cgst_percent: created.lines[0].cgst_percent,
            sgst_percent: created.lines[0].sgst_percent,
            igst_percent: created.lines[0].igst_percent,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].product_name, "Cotton fabric");
    assert.equal(updated.lines[0].tax_code, "5209");
    assert.equal(updated.lines[0].tax_code_description, "Woven fabrics of cotton");
    assert.equal(updated.lines[0].rate, 225);
    assert.equal(updated.lines[0].cgst_percent, 2.5);
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
            cgst_percent: created.lines[0].cgst_percent,
            sgst_percent: created.lines[0].sgst_percent,
            igst_percent: created.lines[0].igst_percent,
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
              cgst_percent: created.lines[0].cgst_percent,
              sgst_percent: created.lines[0].sgst_percent,
              igst_percent: created.lines[0].igst_percent,
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
            ...copyTrioPercentsFromTaxCode(taxNew),
            product_chosen_again: true,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].tax_code, "520911");
    assert.equal(updated.lines[0].tax_code_description, "Now on Cotton");
    assert.equal(updated.lines[0].cgst_percent, 6);
    assert.equal(updated.lines[0].igst_percent, 12);
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
            ...copyTrioPercentsFromTaxCode(taxCode),
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
            ...copyTrioPercentsFromTaxCode(taxB),
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
          ...copyTrioPercentsFromTaxCode(taxCode),
        },
        {
          product_id: productB.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 20,
          ...copyTrioPercentsFromTaxCode(taxCode),
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
            cgst_percent: lineToKeep.cgst_percent,
            sgst_percent: lineToKeep.sgst_percent,
            igst_percent: lineToKeep.igst_percent,
          },
          {
            product_id: productC.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 3,
            rate: 30,
            ...copyTrioPercentsFromTaxCode(taxCode),
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

describe("bill number per collection", () => {
  const sharedNumberParts = ["00", "26", "01"];

  it("saves 00-26-01 in two collections and rejects a second 00-26-01 in one collection", async () => {
    const world = createBillWorld();
    const collectionA = world.seedCollection();
    const collectionB = world.seedCollection();
    const client = world.seedClient();
    const productA = world.seedProduct(collectionA);
    const productB = world.seedProduct(collectionB);
    const taxCode = world.seedTaxCode();

    const inA = await createBill(world.deps, collectionA, {
      ...standardBillPayload({
        world,
        collectionId: collectionA,
        product: productA,
        taxCode,
        client,
      }),
      bill_number_parts: sharedNumberParts,
    });
    const inB = await createBill(world.deps, collectionB, {
      ...standardBillPayload({
        world,
        collectionId: collectionB,
        product: productB,
        taxCode,
        client,
      }),
      bill_number_parts: sharedNumberParts,
    });

    assert.equal(inA.bill_number, "00-26-01");
    assert.equal(inB.bill_number, "00-26-01");

    await assert.rejects(
      () =>
        createBill(world.deps, collectionA, {
          ...standardBillPayload({
            world,
            collectionId: collectionA,
            product: productA,
            taxCode,
            client,
          }),
          bill_number_parts: sharedNumberParts,
        }),
      (error) => {
        assert.ok(error instanceof BillDuplicateNumberError);
        assert.equal(error.message, "This bill number is already in use");
        return true;
      }
    );
  });

  it("edit keeps its own number and may take a number used only in another collection", async () => {
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
      bill_number_parts: sharedNumberParts,
    });
    const billInB = await createBill(world.deps, collectionB, {
      ...standardBillPayload({
        world,
        collectionId: collectionB,
        product: productB,
        taxCode,
        client,
      }),
      bill_number_parts: ["1", "0", "0"],
    });

    const kept = await updateBill(
      world.deps,
      collectionB,
      billInB.bill_id,
      updatePayloadFromBill(billInB)
    );
    assert.equal(kept.bill_number, "1-0-0");

    const retargeted = await updateBill(
      world.deps,
      collectionB,
      billInB.bill_id,
      updatePayloadFromBill(billInB, { bill_number_parts: sharedNumberParts })
    );
    assert.equal(retargeted.bill_number, "00-26-01");
  });

  it("treats 00-26-01 and 0-26-1 as different numbers", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();
    const base = standardBillPayload({ world, collectionId, product, taxCode, client });

    const first = await createBill(world.deps, collectionId, {
      ...base,
      bill_number_parts: ["00", "26", "01"],
    });
    const second = await createBill(world.deps, collectionId, {
      ...base,
      bill_number_parts: ["0", "26", "1"],
    });

    assert.equal(first.bill_number, "00-26-01");
    assert.equal(second.bill_number, "0-26-1");
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
              ...copyTrioPercentsFromTaxCode(taxCode),
            },
          ],
        }),
      /Rate is required/
    );
  });
});

describe("bill tax shape", () => {
  it("switches a saved bill to interstate using the stored copy after Masters moves the tax code", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ cgst: 2.5, sgst: 2.5, igst: 5 });
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({ world, collectionId, product, taxCode, client })
    );

    world.seedTaxCode({
      tax_code_id: taxCode.tax_code_id,
      cgst: 9,
      sgst: 9,
      igst: 18,
    });

    const switched = await updateBill(
      world.deps,
      collectionId,
      created.bill_id,
      updatePayloadFromBill(created, {
        tax_shape: TAX_SHAPE_INTERSTATE,
        lines: [
          {
            bill_line_id: created.lines[0].bill_line_id,
            product_id: product.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 200,
            rate: 220,
            cgst_percent: 2.5,
            sgst_percent: 2.5,
            igst_percent: 5,
          },
        ],
      })
    );

    assert.equal(switched.tax_shape, TAX_SHAPE_INTERSTATE);
    assert.equal(switched.lines[0].cgst_amount, 0);
    assert.equal(switched.lines[0].sgst_amount, 0);
    assert.equal(switched.lines[0].igst_amount, 2200);
    assert.equal(switched.lines[0].line_total, 46200);
    assert.equal(switched.total_bill, 46200);
  });

  it("re-choosing the product on one line copies today's trio while the other line keeps its copy", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ cgst: 2.5, sgst: 2.5, igst: 5 });
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const created = await createBill(
      world.deps,
      collectionId,
      {
        ...standardBillPayload({ world, collectionId, product, taxCode, client }),
        bill_number_parts: ["8", "1", "1"],
        lines: [
          {
            product_id: product.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 1,
            rate: 100,
            ...copyTrioPercentsFromTaxCode(taxCode),
          },
          {
            product_id: product.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 1,
            rate: 100,
            ...copyTrioPercentsFromTaxCode(taxCode),
          },
        ],
      }
    );

    world.seedTaxCode({
      tax_code_id: taxCode.tax_code_id,
      cgst: 9,
      sgst: 9,
      igst: 18,
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
            quantity: 1,
            rate: 100,
            cgst_percent: 9,
            sgst_percent: 9,
            igst_percent: 18,
            product_chosen_again: true,
          },
          {
            bill_line_id: created.lines[1].bill_line_id,
            product_id: product.product_id,
            tax_code_id: taxCode.tax_code_id,
            quantity: 1,
            rate: 100,
            cgst_percent: 2.5,
            sgst_percent: 2.5,
            igst_percent: 5,
          },
        ],
      })
    );

    assert.equal(updated.lines[0].igst_percent, 18);
    assert.equal(updated.lines[1].igst_percent, 5);
    assert.equal(updated.lines[0].cgst_amount, 9);
    assert.equal(updated.lines[1].cgst_amount, 2.5);
  });

  it("rejects a missing tax shape on create and illegal copied trios", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const product = world.seedProduct(collectionId);
    const taxCode = world.seedTaxCode();
    const base = standardBillPayload({ world, collectionId, product, taxCode, client });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...base,
          tax_shape: undefined,
        }),
      /Tax shape is required/
    );

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...base,
          bill_number_parts: ["8", "2", "1"],
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
          ],
        }),
      /IGST on the copied rates/
    );
  });

  it("previews interstate rounding for rate 10.20 separately from within-state", () => {
    const within = previewBillTotals({
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          product_id: "p1",
          tax_code_id: "t1",
          quantity: 1,
          rate: 10.2,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
        },
      ],
    });
    const interstate = previewBillTotals({
      tax_shape: TAX_SHAPE_INTERSTATE,
      lines: [
        {
          product_id: "p1",
          tax_code_id: "t1",
          quantity: 1,
          rate: 10.2,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
        },
      ],
    });

    assert.equal(within.line_previews[0].cgst_amount, 0.26);
    assert.equal(within.total_bill, 10.72);
    assert.equal(interstate.line_previews[0].igst_amount, 0.51);
    assert.equal(interstate.total_bill, 10.71);
  });

  it("keeps an old bill on charged percents when it has no tax shape", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const billId = randomUUID();
    const lineId = randomUUID();
    const savedAt = new Date().toISOString();

    await world.deps.insertBill(
      {
        bill_id: billId,
        collection_id: collectionId,
        bill_number: "7-7-7",
        bill_date: "2026-10-11",
        receiver_mobile: client.mobile,
        receiver_name: client.name,
        receiver_address: client.address,
        receiver_gst_number: client.gst_number,
        receiver_contact_person: client.contact_person,
        receiver_contact_number: client.contact_number,
        total_value: 1000,
        total_tax: 50,
        total_bill: 1050,
        tax_shape: null,
        bank_name: "HDFC Bank",
        bank_address: "MG Road",
        bank_account_number: "012345678",
        bank_ifsc: "HDFC0000123",
        saved_at: savedAt,
      },
      [
        {
          bill_line_id: lineId,
          bill_id: billId,
          line_order: 0,
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 10,
          rate: 100,
          price: 1000,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 25,
          sgst_amount: 25,
          igst_amount: 0,
          tax_rates_are_copy: false,
          line_total: 1050,
        },
      ]
    );

    const updated = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["7", "7", "7"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 10,
          rate: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });

    assert.equal(updated.tax_shape, null);
    assert.equal(updated.lines[0].igst_percent, 0);
    assert.equal(updated.total_bill, 1050);
  });

  it("stores a trio on one re-choice without unlocking tax shape", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const productA = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const productB = world.seedProduct(collectionId, {
      product_name: "Linen",
      tax_code_id: taxCode.tax_code_id,
    });
    const lineA = randomUUID();
    const lineB = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      lines: [
        {
          bill_line_id: lineA,
          product_id: productA.product_id,
          product_name: productA.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 10,
          rate: 100,
          price: 1000,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 25,
          sgst_amount: 25,
          igst_amount: 0,
          line_total: 1050,
        },
        {
          bill_line_id: lineB,
          product_id: productB.product_id,
          product_name: productB.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 5,
          rate: 100,
          price: 500,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 12.5,
          sgst_amount: 12.5,
          igst_amount: 0,
          line_total: 525,
        },
      ],
      totals: { total_value: 1500, total_tax: 75, total_bill: 1575 },
    });

    const updated = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["7", "7", "7"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      lines: [
        {
          bill_line_id: lineA,
          product_id: productA.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 10,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
        {
          bill_line_id: lineB,
          product_id: productB.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 5,
          rate: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
      ],
    });

    assert.equal(updated.tax_shape, null);
    assert.equal(updated.lines[0].igst_percent, 5);
    assert.equal(updated.lines[0].tax_rates_are_copy, true);
    assert.equal(updated.lines[0].igst_amount, 0);
    assert.equal(updated.lines[1].tax_rates_are_copy, false);
  });

  it("unlocks tax shape when every line has been chosen again", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const productA = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const productB = world.seedProduct(collectionId, {
      product_name: "Linen",
      tax_code_id: taxCode.tax_code_id,
    });
    const lineA = randomUUID();
    const lineB = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      lines: [
        {
          bill_line_id: lineA,
          product_id: productA.product_id,
          product_name: productA.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 10,
          rate: 100,
          price: 1000,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 25,
          sgst_amount: 25,
          igst_amount: 0,
          line_total: 1050,
        },
        {
          bill_line_id: lineB,
          product_id: productB.product_id,
          product_name: productB.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 5,
          rate: 100,
          price: 500,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 12.5,
          sgst_amount: 12.5,
          igst_amount: 0,
          line_total: 525,
        },
      ],
      totals: { total_value: 1500, total_tax: 75, total_bill: 1575 },
    });

    const updated = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["7", "7", "7"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: lineA,
          product_id: productA.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 10,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
        {
          bill_line_id: lineB,
          product_id: productB.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 5,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
      ],
    });

    assert.equal(updated.tax_shape, TAX_SHAPE_WITHIN_STATE);
    assert.equal(updated.lines[0].tax_rates_are_copy, true);
    assert.equal(updated.lines[1].tax_rates_are_copy, true);
    assert.equal(updated.lines[0].igst_amount, 0);
    assert.equal(updated.lines[1].igst_amount, 0);
  });

  it("rejects an early tax shape and a wrong shape on unlock", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const lineId = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 10,
          rate: 100,
          price: 1000,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 25,
          sgst_amount: 25,
          igst_amount: 0,
          line_total: 1050,
        },
      ],
    });

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, billId, {
          bill_number_parts: ["7", "7", "7"],
          bill_date: "2026-10-11",
          receiver_mobile: client.mobile,
          tax_shape: TAX_SHAPE_WITHIN_STATE,
          lines: [
            {
              bill_line_id: lineId,
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 10,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 0,
            },
          ],
        }),
      /Tax shape cannot be set until every line has been chosen again/
    );

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, billId, {
          bill_number_parts: ["7", "7", "7"],
          bill_date: "2026-10-11",
          receiver_mobile: client.mobile,
          tax_shape: TAX_SHAPE_INTERSTATE,
          lines: [
            {
              bill_line_id: lineId,
              product_id: product.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 10,
              rate: 100,
              ...copyTrioPercentsFromTaxCode(taxCode),
              product_chosen_again: true,
            },
          ],
        }),
      /Tax shape does not match/
    );

    const converted = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["7", "7", "7"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 10,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
      ],
    });
    assert.equal(converted.tax_shape, TAX_SHAPE_WITHIN_STATE);
  });

  it("keeps an old interstate line on IGST after the product is chosen again", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const lineId = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "8-8-8",
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 10,
          rate: 100,
          price: 1000,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 5,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 50,
          line_total: 1050,
        },
      ],
    });

    const updated = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "8", "8"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      tax_shape: TAX_SHAPE_INTERSTATE,
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 10,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
      ],
    });

    assert.equal(updated.tax_shape, TAX_SHAPE_INTERSTATE);
    assert.equal(updated.lines[0].igst_percent, 5);
    assert.equal(updated.lines[0].cgst_amount, 0);
    assert.equal(updated.lines[0].igst_amount, 50);
  });

  it("does not treat an exempt line as a copy until the product is chosen again", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ cgst: 0, sgst: 0, igst: 0 });
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const lineId = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "8-8-9",
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 2,
          rate: 100,
          price: 200,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 0,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 0,
          line_total: 200,
        },
      ],
    });

    const untouched = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "8", "9"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 0,
        },
      ],
    });
    assert.equal(untouched.lines[0].tax_rates_are_copy, false);

    const converted = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "8", "9"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 0,
          product_chosen_again: true,
        },
      ],
    });
    assert.equal(converted.tax_shape, TAX_SHAPE_WITHIN_STATE);
    assert.equal(converted.lines[0].tax_rates_are_copy, true);

    const interstate = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "8", "9"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      tax_shape: TAX_SHAPE_INTERSTATE,
      lines: [
        {
          bill_line_id: lineId,
          product_id: product.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 0,
        },
      ],
    });
    assert.equal(interstate.total_tax, 0);
  });

  it("counts a new line as a copy and unlocks after the last old line is removed", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const oldProduct = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const newProduct = world.seedProduct(collectionId, {
      product_name: "New yarn",
      tax_code_id: taxCode.tax_code_id,
    });
    const oldLineId = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "8-9-0",
      lines: [
        {
          bill_line_id: oldLineId,
          product_id: oldProduct.product_id,
          product_name: oldProduct.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 2.5,
          sgst_amount: 2.5,
          igst_amount: 0,
          line_total: 105,
        },
      ],
    });

    const withNewLine = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "9", "0"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      lines: [
        {
          bill_line_id: oldLineId,
          product_id: oldProduct.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
        },
        {
          product_id: newProduct.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 50,
          ...copyTrioPercentsFromTaxCode(taxCode),
        },
      ],
    });
    assert.equal(withNewLine.tax_shape, null);
    assert.equal(withNewLine.lines[1].tax_rates_are_copy, true);

    const unlocked = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "9", "0"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: withNewLine.lines[1].bill_line_id,
          product_id: newProduct.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 2,
          rate: 50,
          ...copyTrioPercentsFromTaxCode(taxCode),
        },
      ],
    });
    assert.equal(unlocked.tax_shape, TAX_SHAPE_WITHIN_STATE);
    assert.equal(unlocked.lines.length, 1);
    assert.equal(unlocked.lines[0].tax_rates_are_copy, true);
  });

  it("leaves a mixed old bill without a tax shape", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const withinProduct = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const interstateProduct = world.seedProduct(collectionId, {
      product_name: "Interstate goods",
      tax_code_id: taxCode.tax_code_id,
    });
    const lineA = randomUUID();
    const lineB = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "8-9-1",
      lines: [
        {
          bill_line_id: lineA,
          product_id: withinProduct.product_id,
          product_name: withinProduct.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 2.5,
          sgst_amount: 2.5,
          igst_amount: 0,
          line_total: 105,
        },
        {
          bill_line_id: lineB,
          product_id: interstateProduct.product_id,
          product_name: interstateProduct.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 5,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 5,
          line_total: 105,
        },
      ],
      totals: { total_value: 200, total_tax: 10, total_bill: 210 },
    });

    const updated = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "9", "1"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      lines: [
        {
          bill_line_id: lineA,
          product_id: withinProduct.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
        {
          bill_line_id: lineB,
          product_id: interstateProduct.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
      ],
    });

    assert.equal(updated.tax_shape, null);
    assert.equal(updated.lines[0].tax_rates_are_copy, false);
    assert.equal(updated.lines[0].cgst_percent, 2.5);
    assert.equal(updated.lines[0].sgst_percent, 2.5);
    assert.equal(updated.lines[0].igst_percent, 0);
    assert.equal(updated.lines[1].tax_rates_are_copy, false);
    assert.equal(updated.lines[1].cgst_percent, 0);
    assert.equal(updated.lines[1].sgst_percent, 0);
    assert.equal(updated.lines[1].igst_percent, 5);
  });

  it("rejects a tax shape on a mixed old bill", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const withinProduct = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const interstateProduct = world.seedProduct(collectionId, {
      product_name: "Interstate goods",
      tax_code_id: taxCode.tax_code_id,
    });
    const lineA = randomUUID();
    const lineB = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      lines: [
        {
          bill_line_id: lineA,
          product_id: withinProduct.product_id,
          product_name: withinProduct.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 2.5,
          sgst_amount: 2.5,
          igst_amount: 0,
          line_total: 105,
        },
        {
          bill_line_id: lineB,
          product_id: interstateProduct.product_id,
          product_name: interstateProduct.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 5,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 5,
          line_total: 105,
        },
      ],
      totals: { total_value: 200, total_tax: 10, total_bill: 210 },
    });

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, billId, {
          bill_number_parts: ["8", "9", "2"],
          bill_date: "2026-10-11",
          receiver_mobile: client.mobile,
          tax_shape: TAX_SHAPE_WITHIN_STATE,
          lines: [
            {
              bill_line_id: lineA,
              product_id: withinProduct.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 100,
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 0,
            },
            {
              bill_line_id: lineB,
              product_id: interstateProduct.product_id,
              tax_code_id: taxCode.tax_code_id,
              quantity: 1,
              rate: 100,
              cgst_percent: 0,
              sgst_percent: 0,
              igst_percent: 5,
            },
          ],
        }),
      (err) => {
        assert.ok(err instanceof BillValidationError);
        assert.equal(err.message, "This bill does not use a tax shape");
        return true;
      }
    );
  });

  it("unlocks tax shape when a mixed bill loses the conflicting line in the same save", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const withinProduct = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
    const interstateProduct = world.seedProduct(collectionId, {
      product_name: "Interstate goods",
      tax_code_id: taxCode.tax_code_id,
    });
    const lineA = randomUUID();
    const lineB = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      lines: [
        {
          bill_line_id: lineA,
          product_id: withinProduct.product_id,
          product_name: withinProduct.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 0,
          cgst_amount: 2.5,
          sgst_amount: 2.5,
          igst_amount: 0,
          line_total: 105,
        },
        {
          bill_line_id: lineB,
          product_id: interstateProduct.product_id,
          product_name: interstateProduct.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 0,
          sgst_percent: 0,
          igst_percent: 5,
          cgst_amount: 0,
          sgst_amount: 0,
          igst_amount: 5,
          line_total: 105,
        },
      ],
      totals: { total_value: 200, total_tax: 10, total_bill: 210 },
    });

    const converted = await updateBill(world.deps, collectionId, billId, {
      bill_number_parts: ["8", "9", "3"],
      bill_date: "2026-10-11",
      receiver_mobile: client.mobile,
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: lineA,
          product_id: withinProduct.product_id,
          tax_code_id: taxCode.tax_code_id,
          quantity: 1,
          rate: 100,
          ...copyTrioPercentsFromTaxCode(taxCode),
          product_chosen_again: true,
        },
      ],
    });

    assert.equal(converted.tax_shape, TAX_SHAPE_WITHIN_STATE);
    assert.equal(converted.lines.length, 1);
    assert.equal(converted.lines[0].tax_rates_are_copy, true);
    assert.equal(converted.lines[0].igst_percent, 5);
    assert.equal(converted.lines[0].igst_amount, 0);
  });

  it("infers interstate from copy lines without amounts when the shared shape was remembered", () => {
    const copyLines = [
      {
        tax_rates_are_copy: true,
        cgst_percent: 2.5,
        sgst_percent: 2.5,
        igst_percent: 5,
      },
    ];
    assert.equal(
      inferLegacyBillSharedShape(copyLines, TAX_SHAPE_INTERSTATE),
      TAX_SHAPE_INTERSTATE
    );
    assert.equal(inferLegacyBillSharedShape(copyLines), TAX_SHAPE_WITHIN_STATE);
  });

});
