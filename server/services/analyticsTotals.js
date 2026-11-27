function asSum(value) {
  if (value === undefined || value === null || value === "") return 0;
  return Number(value);
}

export function calculateAnalyticsTotals({
  purchaseSum,
  orderLineSum,
  retailOrderLineSum,
  wholesaleOrderLineSum,
  billTotalSum,
} = {}) {
  const bills = asSum(billTotalSum);

  return {
    totalPurchaseAmount: asSum(purchaseSum),
    totalSalesAmount: asSum(orderLineSum) + bills,
    totalRetailSalesAmount: asSum(retailOrderLineSum),
    totalWholesaleSalesAmount: asSum(wholesaleOrderLineSum) + bills,
  };
}
