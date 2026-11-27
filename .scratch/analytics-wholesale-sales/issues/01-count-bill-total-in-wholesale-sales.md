Status: ready-for-agent

## Parent

[Analytics Wholesale Sales PRD](../PRD.md)

## What to build

The Analytics response for one collection adds every Bill's Total bill to Wholesale Sales and to the sales side of Total Profit. Wholesale Sales is the line prices of wholesale Orders plus that Bill sum. The sales side of Total Profit is every Order line price plus that same Bill sum, so Total Profit stays Retail Sales plus Wholesale Sales minus Total Investment. Retail Sales stays retail Order line prices. Total Investment stays the purchase amount.

A Bill has no retail or wholesale type, so every saved Bill in the collection counts. The amount is Total bill, the price plus the tax, not Total value. There is no date, series, or tax-shape filter. An edited Bill counts its current Total bill. A Bill in another collection does not count. A missing or empty sum counts as zero. Amounts that arrive as numeric text are added as numbers.

Order lines stay quantity times the line price, before the Order's rupee discount. The page keeps reading the same four amounts and still shows whole rupees. The fixed arrows and percents, the products report, the Analytics password, and the dashboard counts stay as they are.

The glossary names Retail Sales, Wholesale Sales, Total Investment, and Total Profit. Wholesale Sales avoids Retail Sales, Total value, and the products report wholesale amount. No decision record.

Tests call the totals calculation with stand-in sums. They cover Bills added to wholesale and to all-sales, no Bills leaving the Order sums unchanged, Bills with no wholesale Orders, missing sums as zero, retail and purchases unchanged, numeric text added as numbers, and wholesale Orders of 10000, retail Orders of 4000, purchases of 6000, and Bills of 2500 producing Wholesale Sales 12500, Retail Sales 4000, Total Investment 6000, and Total Profit 10500. They do not boot HTTP, open a database, or render the page.

## Acceptance criteria

- [ ] Wholesale Sales for a collection is wholesale Order line prices plus every Bill's Total bill in that collection
- [ ] Total value is not the amount added
- [ ] A collection with no Bills keeps its Order-only Wholesale Sales
- [ ] A collection with Bills and no wholesale Orders shows the sum of those Total bills
- [ ] A collection with no Orders and no Bills shows zero
- [ ] Several Bills are summed, and a Bill in another collection is left out
- [ ] An edited Bill counts its current Total bill
- [ ] Retail Sales stays retail Order line prices
- [ ] Total Investment stays the purchase amount
- [ ] Total Profit's sales side includes every Bill's Total bill once, and Total Profit remains Retail Sales plus Wholesale Sales minus Total Investment
- [ ] Wholesale Orders of 10000, retail Orders of 4000, purchases of 6000, and Bills of 2500 show Wholesale Sales 12500, Retail Sales 4000, Total Investment 6000, and Total Profit 10500
- [ ] An Order line still counts quantity times its price, including when the Order has a rupee discount
- [ ] A missing sum counts as zero, and numeric text is added as a number
- [ ] The cards still show whole rupees, and the fixed arrows and percents stay
- [ ] The products report, the Analytics password, and the dashboard counts stay as they are
- [ ] The glossary names Retail Sales, Wholesale Sales, Total Investment, and Total Profit with the meanings above
- [ ] Tests call the calculation with stand-in sums and do not boot HTTP, open a database, or render the page

## Blocked by

None - can start immediately
