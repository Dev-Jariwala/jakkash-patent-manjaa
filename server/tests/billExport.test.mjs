import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import {
  BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE,
  BILL_EXPORT_ONE_SPAN_MESSAGE,
  BILL_EXPORT_SPAN_BILL_DATE,
  BILL_EXPORT_SPAN_BILL_NUMBER,
  exportBills,
  listBills,
} from "../services/bill.js";
import { BillValidationError } from "../services/billErrors.js";
import { createBillWorld, insertLegacyBill } from "./helpers/billWorld.mjs";

function spanPayload(series1, series2, fromThird, toThird) {
  return {
    span_type: BILL_EXPORT_SPAN_BILL_NUMBER,
    series_part_1: series1,
    series_part_2: series2,
    from_third_part: fromThird,
    to_third_part: toThird,
  };
}

function dateSpanPayload(fromDate, toDate) {
  return {
    span_type: BILL_EXPORT_SPAN_BILL_DATE,
    from_date: fromDate,
    to_date: toDate,
  };
}

function minimalLine(world, collectionId) {
  const taxCode = world.seedTaxCode();
  const product = world.seedProduct(collectionId, { tax_code_id: taxCode.tax_code_id });
  return {
    bill_line_id: randomUUID(),
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
  };
}

async function seedJpm2526Fixture(world, collectionId, client) {
  const line = minimalLine(world, collectionId);
  const bills = [
    ["JPM-2526-2", line],
    ["JPM-2526-08", line],
    ["JPM-2526-8", line],
    ["JPM-2526-10", line],
    ["JPM-2526-10A", line],
    ["ABC-2526-4", line],
    ["jpm-2526-1", line],
  ];
  for (const [billNumber, billLine] of bills) {
    await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber,
      lines: [billLine],
    });
  }
}

describe("exportBills bill-number span", () => {
  it("returns JPM-2526 bills in numeric order with gaps and exclusions", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    await seedJpm2526Fixture(world, collectionId, client);

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      spanPayload("JPM", "2526", "1", "10")
    );

    assert.deepEqual(
      bills.map((bill) => bill.bill_number),
      ["JPM-2526-2", "JPM-2526-08", "JPM-2526-8", "JPM-2526-10"]
    );
  });

  it("treats From 10 To 1 as the same span", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    await seedJpm2526Fixture(world, collectionId, client);

    const forward = await exportBills(
      world.deps,
      collectionId,
      spanPayload("JPM", "2526", "1", "10")
    );
    const reversed = await exportBills(
      world.deps,
      collectionId,
      spanPayload("JPM", "2526", "10", "1")
    );

    assert.deepEqual(
      reversed.bills.map((bill) => bill.bill_number),
      forward.bills.map((bill) => bill.bill_number)
    );
  });

  it("returns one Bill for From 5 To 5 when it exists", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const line = minimalLine(world, collectionId);
    await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "JPM-2526-5",
      lines: [line],
    });

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      spanPayload("JPM", "2526", "5", "5")
    );

    assert.equal(bills.length, 1);
    assert.equal(bills[0].bill_number, "JPM-2526-5");
  });

  it("trims spaces around the series parts", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const line = minimalLine(world, collectionId);
    await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "JPM-2526-3",
      lines: [line],
    });

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      spanPayload(" JPM ", " 2526 ", "3", "3")
    );

    assert.equal(bills.length, 1);
    assert.equal(bills[0].bill_number, "JPM-2526-3");
  });

  it("leaves out the same bill number in another collection", async () => {
    const world = createBillWorld();
    const collectionA = world.seedCollection();
    const collectionB = world.seedCollection();
    const client = world.seedClient();
    const line = minimalLine(world, collectionA);
    await insertLegacyBill(world, {
      collectionId: collectionA,
      client,
      billNumber: "JPM-2526-7",
      lines: [line],
    });
    await insertLegacyBill(world, {
      collectionId: collectionB,
      client,
      billNumber: "JPM-2526-7",
      lines: [minimalLine(world, collectionB)],
    });

    const { bills } = await exportBills(
      world.deps,
      collectionA,
      spanPayload("JPM", "2526", "7", "7")
    );

    assert.equal(bills.length, 1);
    assert.equal(bills[0].collection_id, collectionA);
  });

  it("returns no bills for a legal empty span", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      spanPayload("JPM", "2526", "1", "10")
    );

    assert.deepEqual(bills, []);
  });

  it("returns each bill with stored lines, receiver, tax shape, and bank block", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient({ name: "Span Receiver Ltd" });
    const line = minimalLine(world, collectionId);
    await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "JPM-2526-4",
      taxShape: "within-state",
      lines: [line],
    });

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      spanPayload("JPM", "2526", "4", "4")
    );

    const bill = bills[0];
    assert.equal(bill.receiver_name, "Span Receiver Ltd");
    assert.equal(bill.tax_shape, "within-state");
    assert.equal(bill.bank_name, "HDFC Bank");
    assert.equal(bill.lines.length, 1);
    assert.equal(bill.lines[0].product_name, line.product_name);
    assert.equal(bill.lines[0].tax_code, line.tax_code);
  });

  it("rejects a bad series part or non-digit third part", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();

    const cases = [
      spanPayload("", "2526", "1", "10"),
      spanPayload("JPM-EXTRA", "2526", "1", "10"),
      spanPayload("JPM", "2526", "10A", "10"),
      spanPayload("JPM", "2526", "1", ""),
    ];

    for (const payload of cases) {
      await assert.rejects(
        () => exportBills(world.deps, collectionId, payload),
        (error) => {
          assert.ok(error instanceof BillValidationError);
          assert.equal(error.message, BILL_EXPORT_NOT_WHOLE_NUMBERS_MESSAGE);
          return true;
        }
      );
    }
  });

});

describe("exportBills bill-date span", () => {
  const APR_1 = "2026-04-01";
  const APR_2 = "2026-04-02";
  const APR_3 = "2026-04-03";
  const APR_5 = "2026-04-05";

  async function seedAprFixture(world, collectionId, client) {
    const line = minimalLine(world, collectionId);
    const bills = [
      ["JPM-2526-1", APR_1, line],
      ["JPM-2526-10", APR_2, line],
      ["ABC-2526-4", APR_3, line],
      ["JPM-2526-2", APR_5, line],
    ];
    for (const [billNumber, billDate, billLine] of bills) {
      await insertLegacyBill(world, {
        collectionId,
        client,
        billNumber,
        billDate,
        lines: [billLine],
      });
    }
  }

  it("returns bills from 1 Apr through 3 Apr in date order", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    await seedAprFixture(world, collectionId, client);

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      dateSpanPayload(APR_1, APR_3)
    );

    assert.deepEqual(
      bills.map((bill) => bill.bill_number),
      ["JPM-2526-1", "JPM-2526-10", "ABC-2526-4"]
    );
  });

  it("treats From after To as the same date span", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    await seedAprFixture(world, collectionId, client);

    const forward = await exportBills(
      world.deps,
      collectionId,
      dateSpanPayload(APR_1, APR_3)
    );
    const reversed = await exportBills(
      world.deps,
      collectionId,
      dateSpanPayload(APR_3, APR_1)
    );

    assert.deepEqual(
      reversed.bills.map((bill) => bill.bill_number),
      forward.bills.map((bill) => bill.bill_number)
    );
  });

  it("orders bills on the same date by series then third part", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const line = minimalLine(world, collectionId);
    const sameDayBills = [
      "ABC-2526-3",
      "JPM-2526-2",
      "JPM-2526-08",
      "JPM-2526-A",
      "jpm-2526-1",
    ];
    for (const billNumber of sameDayBills) {
      await insertLegacyBill(world, {
        collectionId,
        client,
        billNumber,
        billDate: APR_2,
        lines: [line],
      });
    }

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      dateSpanPayload(APR_2, APR_2)
    );

    assert.deepEqual(
      bills.map((bill) => bill.bill_number),
      sameDayBills
    );
  });

  it("puts a later calendar date after an earlier one regardless of bill number", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const line = minimalLine(world, collectionId);
    await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "JPM-2526-99",
      billDate: APR_1,
      lines: [line],
    });
    await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "JPM-2526-1",
      billDate: APR_2,
      lines: [minimalLine(world, collectionId)],
    });

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      dateSpanPayload(APR_1, APR_2)
    );

    assert.deepEqual(
      bills.map((bill) => bill.bill_number),
      ["JPM-2526-99", "JPM-2526-1"]
    );
  });

  it("returns no bills for a legal empty date span", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();

    const { bills } = await exportBills(
      world.deps,
      collectionId,
      dateSpanPayload(APR_1, APR_3)
    );

    assert.deepEqual(bills, []);
  });

  it("leaves out bills on the same dates in another collection", async () => {
    const world = createBillWorld();
    const collectionA = world.seedCollection();
    const collectionB = world.seedCollection();
    const client = world.seedClient();
    const line = minimalLine(world, collectionA);
    await insertLegacyBill(world, {
      collectionId: collectionA,
      client,
      billNumber: "JPM-2526-1",
      billDate: APR_1,
      lines: [line],
    });
    await insertLegacyBill(world, {
      collectionId: collectionB,
      client,
      billNumber: "JPM-2526-1",
      billDate: APR_1,
      lines: [minimalLine(world, collectionB)],
    });

    const { bills } = await exportBills(
      world.deps,
      collectionA,
      dateSpanPayload(APR_1, APR_1)
    );

    assert.equal(bills.length, 1);
    assert.equal(bills[0].collection_id, collectionA);
  });

  it("rejects a missing or invalid date", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();

    const cases = [
      dateSpanPayload("", APR_3),
      dateSpanPayload(APR_1, ""),
      dateSpanPayload("2026-02-30", APR_3),
      dateSpanPayload(APR_1, "not-a-date"),
    ];

    for (const payload of cases) {
      await assert.rejects(
        () => exportBills(world.deps, collectionId, payload),
        (error) => {
          assert.ok(error instanceof BillValidationError);
          assert.ok(
            error.message === "Bill date is required" ||
              error.message === "Bill date is not valid"
          );
          return true;
        }
      );
    }
  });

  it("rejects a bill number span and a date span together", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();

    await assert.rejects(
      () =>
        exportBills(world.deps, collectionId, {
          span_type: BILL_EXPORT_SPAN_BILL_DATE,
          from_date: APR_1,
          to_date: APR_3,
          series_part_1: "JPM",
          series_part_2: "2526",
        }),
      (error) => {
        assert.ok(error instanceof BillValidationError);
        assert.equal(error.message, BILL_EXPORT_ONE_SPAN_MESSAGE);
        return true;
      }
    );
  });
});

describe("exportBills list unchanged", () => {
  it("listBills still returns bill number, date, receiver, and total bill", async () => {
    const world = createBillWorld();
    const collectionId = world.seedCollection();
    const client = world.seedClient();
    const line = minimalLine(world, collectionId);
    await insertLegacyBill(world, {
      collectionId,
      client,
      billNumber: "JPM-2526-9",
      billDate: "2026-04-02",
      lines: [line],
      totals: { total_value: 100, total_tax: 5, total_bill: 105 },
    });

    const listed = await listBills(world.deps, collectionId, { page: 1, limit: 10 });
    assert.equal(listed.bills.length, 1);
    const row = listed.bills[0];
    assert.equal(row.bill_number, "JPM-2526-9");
    assert.equal(row.bill_date, "2026-04-02");
    assert.equal(row.receiver_name, client.name);
    assert.equal(row.total_bill, 105);
    assert.ok(row.bill_id);
  });
});

