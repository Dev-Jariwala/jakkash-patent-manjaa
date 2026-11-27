import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateAnalyticsTotals } from "../services/analyticsTotals.js";

describe("calculateAnalyticsTotals", () => {
  it("adds every Bill's Total bill to Wholesale Sales and once to the sales side of Total Profit", () => {
    const totals = calculateAnalyticsTotals({
      purchaseSum: 0,
      orderLineSum: 1000,
      retailOrderLineSum: 0,
      wholesaleOrderLineSum: 1000,
      billTotalSum: 500,
    });

    assert.equal(totals.totalWholesaleSalesAmount, 1500);
    assert.equal(totals.totalSalesAmount, 1500);
    assert.equal(totals.totalSalesAmount - totals.totalPurchaseAmount, 1500);
  });

  it("leaves Wholesale Sales and the sales side of Total Profit at the Order sums when there are no Bills", () => {
    const totals = calculateAnalyticsTotals({
      purchaseSum: 6000,
      orderLineSum: 14000,
      retailOrderLineSum: 4000,
      wholesaleOrderLineSum: 10000,
      billTotalSum: 0,
    });

    assert.equal(totals.totalWholesaleSalesAmount, 10000);
    assert.equal(totals.totalSalesAmount, 14000);
  });

  it("shows the summed Total bills as Wholesale Sales when there are no wholesale Orders", () => {
    const totals = calculateAnalyticsTotals({
      purchaseSum: 0,
      orderLineSum: 0,
      retailOrderLineSum: 0,
      wholesaleOrderLineSum: 0,
      billTotalSum: 1680,
    });

    assert.equal(totals.totalWholesaleSalesAmount, 1680);
    assert.equal(totals.totalSalesAmount, 1680);
  });

  it("counts a missing or empty sum as zero", () => {
    const empty = calculateAnalyticsTotals({});

    assert.equal(empty.totalPurchaseAmount, 0);
    assert.equal(empty.totalSalesAmount, 0);
    assert.equal(empty.totalRetailSalesAmount, 0);
    assert.equal(empty.totalWholesaleSalesAmount, 0);

    const billsOnly = calculateAnalyticsTotals({
      purchaseSum: null,
      orderLineSum: "",
      retailOrderLineSum: undefined,
      wholesaleOrderLineSum: null,
      billTotalSum: 500,
    });

    assert.equal(billsOnly.totalPurchaseAmount, 0);
    assert.equal(billsOnly.totalRetailSalesAmount, 0);
    assert.equal(billsOnly.totalWholesaleSalesAmount, 500);
    assert.equal(billsOnly.totalSalesAmount, 500);
  });

  it("leaves Retail Sales and Total Investment unchanged when Bills are added", () => {
    const totals = calculateAnalyticsTotals({
      purchaseSum: 6000,
      orderLineSum: 14000,
      retailOrderLineSum: 4000,
      wholesaleOrderLineSum: 10000,
      billTotalSum: 2500,
    });

    assert.equal(totals.totalRetailSalesAmount, 4000);
    assert.equal(totals.totalPurchaseAmount, 6000);
  });

  it("adds an Order sum and a Bill sum that arrive as numeric text as numbers", () => {
    const totals = calculateAnalyticsTotals({
      purchaseSum: "6000",
      orderLineSum: "14000",
      retailOrderLineSum: "4000",
      wholesaleOrderLineSum: "10000",
      billTotalSum: "2500",
    });

    assert.equal(totals.totalWholesaleSalesAmount, 12500);
    assert.equal(totals.totalSalesAmount, 16500);
    assert.equal(totals.totalRetailSalesAmount, 4000);
    assert.equal(totals.totalPurchaseAmount, 6000);
  });

  it("returns Wholesale Sales 12500, Retail Sales 4000, Total Investment 6000, and Total Profit 10500 for the checkable example", () => {
    const totals = calculateAnalyticsTotals({
      purchaseSum: 6000,
      orderLineSum: 14000,
      retailOrderLineSum: 4000,
      wholesaleOrderLineSum: 10000,
      billTotalSum: 2500,
    });

    assert.equal(totals.totalWholesaleSalesAmount, 12500);
    assert.equal(totals.totalRetailSalesAmount, 4000);
    assert.equal(totals.totalPurchaseAmount, 6000);
    assert.equal(totals.totalSalesAmount - totals.totalPurchaseAmount, 10500);
    assert.equal(
      totals.totalRetailSalesAmount + totals.totalWholesaleSalesAmount - totals.totalPurchaseAmount,
      totals.totalSalesAmount - totals.totalPurchaseAmount
    );
  });
});
