import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  TAX_SHAPE_WITHIN_STATE,
  createBill,
  getBill,
  listBills,
  previewBillTotals,
  updateBill,
} from "../services/bill.js";
import {
  BillDuplicateProductError,
  BillInsufficientStockError,
  BillValidationError,
} from "../services/billErrors.js";
import {
  copyTrioPercentsFromTaxCode,
  createBillWorld,
  insertLegacyBill,
  standardBillPayload,
  updatePayloadFromBill,
} from "./helpers/billWorld.mjs";

function linePayload(product, taxCode, quantity, rate = 100) {
  return {
    product_id: product.product_id,
    tax_code_id: taxCode.tax_code_id,
    quantity,
    rate,
    ...copyTrioPercentsFromTaxCode(taxCode),
  };
}

function smallBillPayload({ world, collectionId, product, taxCode, client, quantity = 5, overrides = {} }) {
  return standardBillPayload({
    world,
    collectionId,
    product,
    taxCode,
    client,
    overrides: {
      lines: [linePayload(product, taxCode, quantity)],
      ...overrides,
    },
  });
}

describe("bill stock", () => {
  it("create deducts stock and sets stock_applied", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 50,
    });

    const saved = await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 5 })
    );

    assert.equal(world.getProductStock(product.product_id), 45);
    assert.equal(saved.stock_applied, true);
  });

  it("create refuses quantity above stock and writes nothing", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 3,
    });

    await assert.rejects(
      () =>
        createBill(
          world.deps,
          collectionId,
          smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 5 })
        ),
      (error) => {
        assert.ok(error instanceof BillInsufficientStockError);
        assert.equal(error.code, "BILL_INSUFFICIENT_STOCK");
        assert.match(error.message, /only 3 in stock, but 5 requested/);
        return true;
      }
    );

    assert.equal(world.getProductStock(product.product_id), 3);
    const listed = await listBills(world.deps, collectionId);
    assert.equal(listed.bills.length, 0);
  });

  it("create refuses a product with 0 stock", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 0,
    });

    await assert.rejects(
      () =>
        createBill(
          world.deps,
          collectionId,
          smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 1 })
        ),
      (error) => error instanceof BillInsufficientStockError
    );
  });

  it("deducts Labour like any other product", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ type: "SAC", code: "998821" });
    const labour = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      product_name: "Stitching",
      stock_in_hand: 10,
      is_labour: true,
    });

    await createBill(
      world.deps,
      collectionId,
      smallBillPayload({
        world,
        collectionId,
        product: labour,
        taxCode,
        client,
        quantity: 4,
      })
    );

    assert.equal(world.getProductStock(labour.product_id), 6);
  });

  it("refuses duplicate products on create", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          lines: [
            linePayload(product, taxCode, 1),
            linePayload(product, taxCode, 2),
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillDuplicateProductError);
        assert.equal(error.code, "BILL_DUPLICATE_PRODUCT");
        return true;
      }
    );
  });

  it("refuses duplicate products on update", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    const saved = await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 2 })
    );

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, saved.bill_id, {
          ...updatePayloadFromBill(saved),
          lines: [
            linePayload(product, taxCode, 1),
            linePayload(product, taxCode, 1),
          ],
        }),
      (error) => error instanceof BillDuplicateProductError
    );
  });

  it("refuses update on a legacy bill that still has duplicate lines in the payload", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 100,
    });

    const lineId1 = randomUUID();
    const lineId2 = randomUUID();
    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      taxShape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: lineId1,
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 100,
          price: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
          cgst_amount: 2.5,
          sgst_amount: 2.5,
          igst_amount: 0,
          line_total: 105,
          tax_rates_are_copy: true,
        },
        {
          bill_line_id: lineId2,
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 2,
          rate: 100,
          price: 200,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
          cgst_amount: 5,
          sgst_amount: 5,
          igst_amount: 0,
          line_total: 210,
          tax_rates_are_copy: true,
        },
      ],
    });

    const bill = await getBill(world.deps, collectionId, billId);

    await assert.rejects(
      () => updateBill(world.deps, collectionId, billId, updatePayloadFromBill(bill)),
      (error) => error instanceof BillDuplicateProductError
    );

    const fixed = await updateBill(world.deps, collectionId, billId, {
      ...updatePayloadFromBill(bill),
      lines: [
        {
          bill_line_id: lineId1,
          ...linePayload(product, taxCode, 3),
        },
      ],
    });

    assert.equal(fixed.lines.length, 1);
    assert.equal(fixed.stock_applied, true);
  });

  it("update increase takes only the delta", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 20,
    });

    const saved = await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 2 })
    );
    assert.equal(world.getProductStock(product.product_id), 18);

    await updateBill(world.deps, collectionId, saved.bill_id, {
      ...updatePayloadFromBill(saved),
      lines: [linePayload(product, taxCode, 5)],
    });

    assert.equal(world.getProductStock(product.product_id), 15);
  });

  it("update decrease restores stock", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 20,
    });

    const saved = await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 5 })
    );

    await updateBill(world.deps, collectionId, saved.bill_id, {
      ...updatePayloadFromBill(saved),
      lines: [
        {
          bill_line_id: saved.lines[0].bill_line_id,
          ...linePayload(product, taxCode, 2),
        },
      ],
    });

    assert.equal(world.getProductStock(product.product_id), 18);
  });

  it("removing a line restores its quantity", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const productA = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 20,
      product_name: "A",
    });
    const productB = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 20,
      product_name: "B",
    });

    const saved = await createBill(world.deps, collectionId, {
      ...smallBillPayload({ world, collectionId, product: productA, taxCode, client, quantity: 3 }),
      lines: [linePayload(productA, taxCode, 3), linePayload(productB, taxCode, 4)],
    });
    assert.equal(world.getProductStock(productA.product_id), 17);
    assert.equal(world.getProductStock(productB.product_id), 16);

    await updateBill(world.deps, collectionId, saved.bill_id, {
      ...updatePayloadFromBill(saved),
      lines: [linePayload(productA, taxCode, 3)],
    });

    assert.equal(world.getProductStock(productB.product_id), 20);
  });

  it("adding a line deducts its quantity", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const productA = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 20,
    });
    const productB = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
    });

    const saved = await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product: productA, taxCode, client, quantity: 2 })
    );

    await updateBill(world.deps, collectionId, saved.bill_id, {
      ...updatePayloadFromBill(saved),
      lines: [linePayload(productA, taxCode, 2), linePayload(productB, taxCode, 3)],
    });

    assert.equal(world.getProductStock(productB.product_id), 7);
  });

  it("changing a line product restores old and deducts new", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const oldProduct = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
      product_name: "Old",
    });
    const newProduct = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
      product_name: "New",
    });

    const saved = await createBill(
      world.deps,
      collectionId,
      smallBillPayload({
        world,
        collectionId,
        product: oldProduct,
        taxCode,
        client,
        quantity: 4,
      })
    );
    assert.equal(world.getProductStock(oldProduct.product_id), 6);

    await updateBill(world.deps, collectionId, saved.bill_id, {
      ...updatePayloadFromBill(saved),
      lines: [
        {
          ...linePayload(newProduct, taxCode, 3),
          bill_line_id: saved.lines[0].bill_line_id,
          product_chosen_again: true,
        },
      ],
    });

    assert.equal(world.getProductStock(oldProduct.product_id), 10);
    assert.equal(world.getProductStock(newProduct.product_id), 7);
  });

  it("refuses an edit when the increase exceeds stock plus the bill old quantity", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 3,
    });

    const saved = await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 2 })
    );
    assert.equal(world.getProductStock(product.product_id), 1);

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, saved.bill_id, {
          ...updatePayloadFromBill(saved),
          lines: [linePayload(product, taxCode, 6)],
        }),
      (error) => {
        assert.ok(error instanceof BillInsufficientStockError);
        assert.match(error.message, /only 1 in stock, but 4 requested/);
        return true;
      }
    );

    assert.equal(world.getProductStock(product.product_id), 1);
  });

  it("legacy first save deducts new quantities only and marks stock_applied", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
    });

    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      taxShape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: randomUUID(),
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 4,
          rate: 100,
          price: 400,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
          cgst_amount: 10,
          sgst_amount: 10,
          igst_amount: 0,
          line_total: 420,
          tax_rates_are_copy: true,
        },
      ],
    });

    assert.equal(world.getProductStock(product.product_id), 10);

    const bill = await getBill(world.deps, collectionId, billId);
    assert.equal(bill.stock_applied, false);

    await updateBill(world.deps, collectionId, billId, updatePayloadFromBill(bill));

    assert.equal(world.getProductStock(product.product_id), 6);
    const after = await getBill(world.deps, collectionId, billId);
    assert.equal(after.stock_applied, true);
  });

  it("legacy later edit reconciles normally", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
    });

    const { billId } = await insertLegacyBill(world, {
      collectionId,
      client,
      taxShape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: randomUUID(),
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 4,
          rate: 100,
          price: 400,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
          cgst_amount: 10,
          sgst_amount: 10,
          igst_amount: 0,
          line_total: 420,
          tax_rates_are_copy: true,
        },
      ],
    });

    const bill = await getBill(world.deps, collectionId, billId);
    await updateBill(world.deps, collectionId, billId, updatePayloadFromBill(bill));
    assert.equal(world.getProductStock(product.product_id), 6);

    const applied = await getBill(world.deps, collectionId, billId);
    await updateBill(world.deps, collectionId, billId, {
      ...updatePayloadFromBill(applied),
      lines: [linePayload(product, taxCode, 2)],
    });

    assert.equal(world.getProductStock(product.product_id), 8);
  });

  it("does not change total_stock on create", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const totalStockBefore = 50;
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 50,
      total_stock: totalStockBefore,
    });

    await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 5 })
    );

    const unchanged = await world.deps.getProductById(product.product_id);
    assert.equal(unchanged.total_stock, totalStockBefore);
  });

  it("preview totals stays money-only", () => {
    const preview = previewBillTotals({
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          product_id: "p1",
          tax_code_id: "t1",
          quantity: 10,
          rate: 100,
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
        },
      ],
    });
    assert.equal(preview.total_value, 1000);
    assert.equal(preview.total_bill, 1050);
  });

  it("list bills shape is unchanged", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });

    await createBill(
      world.deps,
      collectionId,
      smallBillPayload({ world, collectionId, product, taxCode, client, quantity: 1 })
    );

    const listed = await listBills(world.deps, collectionId);
    assert.equal(listed.bills.length, 1);
    assert.equal(Object.keys(listed.bills[0]).sort().join(","), [
      "bill_date",
      "bill_id",
      "bill_number",
      "receiver_name",
      "saved_at",
      "total_bill",
    ].sort().join(","));
  });

  it("getProductById exposes stock_in_hand through create flow", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const product = world.seedProduct(collectionId, { stock_in_hand: 7 });
    const row = await world.deps.getProductById(product.product_id);
    assert.equal(row.stock_in_hand, 7);
  });
});
