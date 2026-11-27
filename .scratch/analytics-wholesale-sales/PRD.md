Status: ready-for-agent

# Analytics Wholesale Sales PRD

## Problem Statement

Analytics shows four rupee cards for the open collection, and none of them include Bills. Wholesale Sales is only the line prices of wholesale Orders. A shop that records a GST sale as a Bill sees that sale missing from Wholesale Sales and from Total Profit. Retail Sales and Total Investment are not the gap. The products report is not the gap.

## Solution

Wholesale Sales for a collection becomes the line prices of its wholesale Orders, plus every Bill's Total bill in that collection. Total Profit's sales side becomes every Order line price in that collection, plus every Bill's Total bill, so Total Profit stays Retail Sales plus Wholesale Sales minus Total Investment. Retail Sales stays retail Order line prices. Total Investment stays purchases. A Bill has no retail or wholesale type, so every Bill in the collection is wholesale money. The amount added is Total bill, which is the price plus the tax, not Total value. Order money stays quantity times the line price, before the Order's rupee discount. There is no date filter. The Analytics cards, their fixed arrows and percents, and the products report stay as they are. The glossary names the four Analytics amounts.

## User Stories

1. As an operator, I want Wholesale Sales to include every Bill in the open collection, so that a GST sale is visible in Analytics.
2. As an operator, I want each Bill to contribute its Total bill, so that the count is the price plus the tax.
3. As an operator, I want Total value left out of Wholesale Sales, so that tax is not dropped from the Bill amount.
4. As an operator, I want that Bill amount added on top of the wholesale Order lines already counted, so that older wholesale Orders stay in the count.
5. As an operator, I want a collection with no Bills to keep today's Wholesale Sales, so that Orders alone still add up.
6. As an operator, I want a collection with Bills and no wholesale Orders to show the sum of those Total bills as Wholesale Sales, so that a Bill-only shop still has a count.
7. As an operator, I want a collection with no Orders and no Bills to show Wholesale Sales as zero, so that an empty collection is not a blank card.
8. As an operator, I want several Bills summed, so that two Total bills of 1180 and 500 count as 1680.
9. As an operator, I want a Bill in another collection left out, so that the open collection is the only one that counts.
10. As an operator, I want every saved Bill in the collection counted, so that there is no date window and no hidden status filter.
11. As an operator, I want an edited Bill to count its current Total bill, so that a correction replaces the old amount.
12. As an operator, I want Retail Sales to stay retail Order line prices, so that Bills do not land on the retail card.
13. As an operator, I want Total Investment to stay the purchase amount, so that Bills do not change what the shop spent.
14. As an operator, I want Total Profit's sales side to include every Bill's Total bill once, so that profit moves with Wholesale Sales.
15. As an operator, I want Total Profit to remain Retail Sales plus Wholesale Sales minus Total Investment, so that the four cards still reconcile.
16. As an operator, I want wholesale Orders of 10000, retail Orders of 4000, purchases of 6000, and Bills whose Total bill is 2500 to show Wholesale Sales 12500, Retail Sales 4000, Total Investment 6000, and Total Profit 10500, so that the example is checkable.
17. As an operator, I want an Order line to keep counting quantity times its price, so that the Order's rupee discount still does not reduce Analytics.
18. As an operator, I want a wholesale Order line of quantity 2 at price 100 to contribute 200 even when the Order has a discount, so that the Order rule is unchanged.
19. As an operator, I want a missing Order sum treated as zero when Bills are added, so that a collection with only Bills does not become a blank total.
20. As an operator, I want a Bill amount stored with paise to be added in full, so that the totals are the exact rupees and paise before the card shows them.
21. As an operator, I want the Wholesale Sales card to keep showing a whole rupee, so that the display does not grow paise.
22. As an operator, I want the Total Profit card to keep showing a whole rupee, so that profit matches the other cards.
23. As an operator, I want the fixed arrows and percents left on all four cards, so that this change is the counts only.
24. As an operator, I want the products report's wholesale amount left on wholesale Order lines, so that the report does not start including Bills.
25. As an operator, I want the Analytics password left as it is, so that opening the page is unchanged.
26. As an operator, I want the dashboard counts left as they are, so that record counts are not confused with these rupee totals.
27. As an operator, I want the glossary to name Retail Sales, so that the retail card has a canonical meaning.
28. As an operator, I want the glossary to name Wholesale Sales as wholesale Order line prices plus every Bill's Total bill in that collection, so that the wholesale card is not read as Orders alone.
29. As an operator, I want the glossary to tell a reader to avoid calling Wholesale Sales Retail Sales, Total value, or the products report wholesale amount, so that those three stay different.
30. As an operator, I want the glossary to name Total Investment as the purchase amount for one collection, so that the investment card has a canonical meaning.
31. As an operator, I want the glossary to name Total Profit as Retail Sales plus Wholesale Sales minus Total Investment, so that profit is defined by the other three amounts.
32. As an operator, I want no new decision record, so that the glossary is the place that holds this boundary.

## Implementation Decisions

- The Analytics response keeps its four amounts: purchase amount, all-sales amount, retail sales amount, and wholesale sales amount. The page already reads them. Total Profit on the page stays all-sales amount minus purchase amount, so the page formula does not change.
- One calculation owns the arithmetic. Its inputs are five numbers for one collection: the purchase sum, the sum of every Order line price, the sum of retail Order line prices, the sum of wholesale Order line prices, and the sum of every Bill's Total bill. A missing or empty sum is 0. Values that arrive as numeric text are coerced to numbers before they are added, so two amounts are never concatenated.
- The Bill sum is added to the wholesale sales amount and to the all-sales amount. It is not added to the retail sales amount or the purchase amount. That single add is what makes Retail Sales plus Wholesale Sales equal the sales side of Total Profit.
- The loader sums `total_bill` for Bills in the requested collection only, with an empty set as 0. It does not filter by date, series, or tax shape. It passes the five sums into the calculation and returns the calculation's four amounts.
- Order sums stay quantity times line price. They are not switched to the Order's total due, subtotal, or discounted total.
- No schema change. No new Analytics card. No change to the products report, the card arrows, the password, or the dashboard counts.
- The glossary gains an Analytics group: Retail Sales, Wholesale Sales, Total Investment, and Total Profit, with the meanings in the user stories. Total bill already means the amount of a Bill after the tax. No ADR.

## Testing Decisions

- A good test asserts the four amounts an operator would see in the Analytics response: Wholesale Sales includes each Bill's Total bill, Total Profit's sales side includes that same sum once, and Retail Sales and Total Investment do not move.
- There is one seam: the analytics totals calculation. Tests call it with stand-in sums. They do not boot HTTP, open a database, render the Analytics page, or read the products report.
- Prior art is the Bill domain tests, which call a function with stand-in data and assert the outcome. This seam is narrower: pure sums in, four amounts out.
- The suite covers: Bills added to wholesale and to all-sales; Total bill used rather than a pre-tax figure (the caller passes the Total bill sum); no Bills leaves the Order sums unchanged; Bills and no wholesale Orders; all sums missing become zeros; several Bills already summed by the caller are added once; retail and purchases are returned unchanged; an Order sum and a Bill sum that arrive as numeric text are added as numbers; the checkable example of wholesale Orders 10000, retail Orders 4000, purchases 6000, and Bills 2500.
- The loader's collection filter and the page's whole-rupee display are outside this seam.

## Out of Scope

- Putting Bills on Retail Sales, or splitting Bills into retail and wholesale.
- Using Total value, total tax, line totals, or any amount other than Total bill.
- Changing how Order lines are summed, including the Order's rupee discount, advance, subtotal, or total due.
- A date filter, a bill-series filter, or a tax-shape filter on Analytics.
- The products report, including its wholesale quantity and wholesale amount.
- The fixed arrows and percents on the four cards.
- Showing paise on the cards. The totals keep paise; the cards keep dropping them.
- The Analytics password.
- Dashboard record counts.
- Any change to Orders, Bills, stock, Export, or WhatsApp delivery.
- Stopping the same physical sale from being saved as both an Order and a Bill. Shop practice is one or the other. If both records exist, both amounts count.
- An ADR.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- Wholesale Order lines are before tax and before the Order discount. A Bill contributes Total bill, which includes tax. That mix is deliberate.
- ADR-0026 records that a physical sale is an Order or a Bill, never both. Analytics does not enforce that. It sums the records that exist.
- Retail Sales plus Wholesale Sales equals the sales side of Total Profit only because every Bill is added once, on the wholesale side.
