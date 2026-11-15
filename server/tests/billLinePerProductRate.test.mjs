import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  TAX_SHAPE_WITHIN_STATE,
  createBill,
  getBill,
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

describe("bill line per product and rate", () => {
  it("saves two lines of one product at different rates with correct prices", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      product_name: "Cotton",
      stock_in_hand: 200,
    });

    const saved = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      lines: [
        linePayload(product, taxCode, 100, 220),
        linePayload(product, taxCode, 20, 270),
      ],
    });

    assert.equal(saved.lines.length, 2);
    const byRate = [...saved.lines].sort((a, b) => a.rate - b.rate);
    assert.equal(byRate[0].quantity, 100);
    assert.equal(byRate[0].rate, 220);
    assert.equal(byRate[0].price, 22000);
    assert.equal(byRate[1].quantity, 20);
    assert.equal(byRate[1].rate, 270);
    assert.equal(byRate[1].price, 5400);
    assert.equal(world.getProductStock(product.product_id), 80);
  });

  it("saves a third different rate as its own line", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 50,
    });

    const saved = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      lines: [
        linePayload(product, taxCode, 5, 100),
        linePayload(product, taxCode, 5, 110),
        linePayload(product, taxCode, 5, 120),
      ],
    });
    assert.equal(saved.lines.length, 3);
    assert.equal(world.getProductStock(product.product_id), 35);
  });

  it("refuses the same product at the same rate on create and update", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      product_name: "Cotton",
      stock_in_hand: 50,
    });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          lines: [
            linePayload(product, taxCode, 1, 220),
            linePayload(product, taxCode, 2, 220),
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillDuplicateProductError);
        assert.equal(error.code, "BILL_DUPLICATE_PRODUCT");
        assert.match(error.message, /Cotton is already on this bill at 220/);
        return true;
      }
    );

    const saved = await createBill(
      world.deps,
      collectionId,
      standardBillPayload({
        world,
        collectionId,
        product,
        taxCode,
        client,
        overrides: { lines: [linePayload(product, taxCode, 2, 220)] },
      })
    );

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, saved.bill_id, {
          ...updatePayloadFromBill(saved),
          lines: [
            linePayload(product, taxCode, 1, 220),
            linePayload(product, taxCode, 1, 220),
          ],
        }),
      (error) => error instanceof BillDuplicateProductError
    );
  });

  it("treats normalized rates as the same and distinct paise as different lines", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 20,
    });

    let serial = 1;
    for (const pair of [
      ["220", "220.00"],
      ["220.5", "220.50"],
    ]) {
      await assert.rejects(
        () =>
          createBill(world.deps, collectionId, {
            ...standardBillPayload({ world, collectionId, product, taxCode, client }),
            bill_number_parts: ["NR", "1", String(serial++)],
            lines: [
              linePayload(product, taxCode, 1, pair[0]),
              linePayload(product, taxCode, 1, pair[1]),
            ],
          }),
        (error) => error instanceof BillDuplicateProductError
      );
    }

    const saved = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      bill_number_parts: ["NR", "1", String(serial++)],
      lines: [
        linePayload(product, taxCode, 1, "220.50"),
        linePayload(product, taxCode, 1, "220.51"),
      ],
    });
    assert.equal(saved.lines.length, 2);
  });

  it("allows rate 0 beside a positive rate and refuses two lines at 0", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
    });

    const mixed = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      lines: [linePayload(product, taxCode, 2, 0), linePayload(product, taxCode, 3, 270)],
    });
    assert.equal(mixed.lines.length, 2);

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          bill_number_parts: ["ZR", "1", "2"],
          lines: [linePayload(product, taxCode, 1, 0), linePayload(product, taxCode, 1, 0)],
        }),
      (error) => error instanceof BillDuplicateProductError
    );
  });

  it("refuses the same rate when GST percents differ", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
    });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          lines: [
            {
              ...linePayload(product, taxCode, 1, 220),
              cgst_percent: 2.5,
              sgst_percent: 2.5,
              igst_percent: 5,
            },
            {
              ...linePayload(product, taxCode, 1, 220),
              cgst_percent: 9,
              sgst_percent: 9,
              igst_percent: 18,
            },
          ],
        }),
      (error) => error instanceof BillDuplicateProductError
    );
  });

  it("keeps separate tax copies per rate and charges the bill tax shape per line", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 10,
    });

    const saved = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      lines: [
        {
          ...linePayload(product, taxCode, 1, 220),
          cgst_percent: 2.5,
          sgst_percent: 2.5,
          igst_percent: 5,
        },
        {
          ...linePayload(product, taxCode, 1, 270),
          cgst_percent: 9,
          sgst_percent: 9,
          igst_percent: 18,
        },
      ],
    });

    const low = saved.lines.find((line) => line.rate === 220);
    const high = saved.lines.find((line) => line.rate === 270);
    assert.equal(low.cgst_percent, 2.5);
    assert.equal(high.cgst_percent, 9);
    assert.ok(low.cgst_amount > 0);
    assert.equal(low.igst_amount, 0);
    assert.ok(high.cgst_amount > low.cgst_amount);
    assert.equal(high.igst_amount, 0);
  });

  it("sums stock per product on create and refuses the total", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      product_name: "Cotton",
      stock_in_hand: 100,
    });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          lines: [
            linePayload(product, taxCode, 80, 220),
            linePayload(product, taxCode, 30, 270),
          ],
        }),
      (error) => {
        assert.ok(error instanceof BillInsufficientStockError);
        assert.match(error.message, /only 100 in stock, but 110 requested/);
        return true;
      }
    );

    assert.equal(world.getProductStock(product.product_id), 100);

    await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      bill_number_parts: ["8", "0", "2"],
      lines: [
        linePayload(product, taxCode, 80, 220),
        linePayload(product, taxCode, 20, 270),
      ],
    });
    assert.equal(world.getProductStock(product.product_id), 0);
  });

  it("reconciles edit stock across lines of one product", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode();
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 100,
    });

    const saved = await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product, taxCode, client }),
      lines: [linePayload(product, taxCode, 100, 220)],
    });
    assert.equal(world.getProductStock(product.product_id), 0);

    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, saved.bill_id, {
          ...updatePayloadFromBill(saved),
          lines: [
            {
              bill_line_id: saved.lines[0].bill_line_id,
              ...linePayload(product, taxCode, 100, 220),
            },
            linePayload(product, taxCode, 20, 270),
          ],
        }),
      (error) => error instanceof BillInsufficientStockError
    );

    world.setProductStock(product.product_id, 20);
    await updateBill(world.deps, collectionId, saved.bill_id, {
      ...updatePayloadFromBill(saved),
      lines: [
        {
          bill_line_id: saved.lines[0].bill_line_id,
          ...linePayload(product, taxCode, 100, 220),
        },
        linePayload(product, taxCode, 20, 270),
      ],
    });
    assert.equal(world.getProductStock(product.product_id), 0);

    world.setProductStock(product.product_id, 50);
    const twoRate = await updateBill(world.deps, collectionId, saved.bill_id, {
      ...updatePayloadFromBill(await getBill(world.deps, collectionId, saved.bill_id)),
      lines: [
        {
          bill_line_id: saved.lines[0].bill_line_id,
          ...linePayload(product, taxCode, 80, 220),
        },
        linePayload(product, taxCode, 30, 270),
      ],
    });
    assert.equal(twoRate.lines.length, 2);
    assert.equal(world.getProductStock(product.product_id), 60);
  });

  it("handles legacy same-rate pairs and different-rate pairs", async () => {
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
    const { billId: sameRateId } = await insertLegacyBill(world, {
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

    const sameRateBill = await getBill(world.deps, collectionId, sameRateId);
    await assert.rejects(
      () =>
        updateBill(world.deps, collectionId, sameRateId, updatePayloadFromBill(sameRateBill)),
      (error) => error instanceof BillDuplicateProductError
    );

    const lineA = randomUUID();
    const lineB = randomUUID();
    const { billId: diffRateId } = await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "LEG-1-2",
      taxShape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        {
          bill_line_id: lineA,
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
          bill_line_id: lineB,
          product_id: product.product_id,
          product_name: product.product_name,
          tax_code_id: taxCode.tax_code_id,
          tax_code: taxCode.code,
          tax_code_description: taxCode.description,
          quantity: 1,
          rate: 200,
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

    const diffRateBill = await getBill(world.deps, collectionId, diffRateId);
    const updated = await updateBill(
      world.deps,
      collectionId,
      diffRateId,
      updatePayloadFromBill(diffRateBill)
    );
    assert.equal(updated.lines.length, 2);
    assert.equal(updated.stock_applied, true);
  });

  it("refuses a zero total bill and keeps price as quantity times rate", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const taxCode = world.seedTaxCode({ cgst_percent: 0, sgst_percent: 0, igst_percent: 0 });
    const product = world.seedProduct(collectionId, {
      tax_code_id: taxCode.tax_code_id,
      stock_in_hand: 5,
    });

    await assert.rejects(
      () =>
        createBill(world.deps, collectionId, {
          ...standardBillPayload({ world, collectionId, product, taxCode, client }),
          lines: [linePayload(product, taxCode, 1, 0)],
        }),
      (error) => error instanceof BillValidationError
    );

    const preview = previewBillTotals({
      tax_shape: TAX_SHAPE_WITHIN_STATE,
      lines: [
        linePayload(product, taxCode, 10, 100.5),
        linePayload(product, taxCode, 2, 200.25),
      ],
    });
    assert.equal(preview.total_value, 1405.5);
  });

  it("deducts labour across two rates of the same labour product", async () => {
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

    await createBill(world.deps, collectionId, {
      ...standardBillPayload({ world, collectionId, product: labour, taxCode, client }),
      lines: [linePayload(labour, taxCode, 4, 50), linePayload(labour, taxCode, 3, 60)],
    });
    assert.equal(world.getProductStock(labour.product_id), 3);
  });
});