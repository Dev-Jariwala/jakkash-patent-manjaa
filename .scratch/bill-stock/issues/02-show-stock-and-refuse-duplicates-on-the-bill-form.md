Status: ready-for-agent

## Parent

[Bill stock PRD](../PRD.md)

## What to build

The Bills form shows what is in stock and refuses a line that cannot be covered. Product options carry `stock_in_hand`. Each line shows the available stock next to the Product. Quantity is validated inline against that stock and the submit is blocked with a clear message naming the Product, the available quantity, and the requested quantity. There is no add-stock control and no link to the Stocks screen; stock is received on the Stocks screen only.

On an edit, the inline limit includes the Bill's own already-deducted quantity only when the Bill's `stock_applied` is true and the line's Product is unchanged. If the Product was changed, the limit is the new Product's current stock. On a legacy Bill whose `stock_applied` is false, the limit is current stock only, matching the cutover rule on the server. Keeping the same quantity on a normal edit is therefore allowed even when stock in hand is now 0.

The same Product is refused on two lines inline. An existing Bill that already contains duplicates shows the duplicate error and blocks the save until the operator removes the extra line and folds its quantity into the remaining one.

The server remains authoritative and re-checks stock atomically on save. A server refusal is shown as the save error. A successful save invalidates the products query so the stock shown on the next visit is current.

The Bills list, Bill view, printed Bill, Export, Orders, and preview totals are unchanged. The preview stays a money calculation.

## Acceptance criteria

- [ ] Product options on the Bill form carry stock in hand
- [ ] Each Bill line shows the Product's available stock
- [ ] A line whose quantity exceeds available stock shows an inline error and blocks submit
- [ ] The error names the Product, the available quantity, and the requested quantity
- [ ] On an edit with `stock_applied = true` and an unchanged Product, the limit includes the Bill's own old quantity
- [ ] On an edit with a changed Product, the limit uses the new Product's current stock
- [ ] On a legacy Bill with `stock_applied = false`, the limit uses current stock only
- [ ] A stored Product that is missing from the current catalog shows no stock limit and is left to the server
- [ ] The same Product on two lines shows an inline duplicate error and blocks submit
- [ ] An existing Bill with duplicates is blocked until the extra line is removed
- [ ] There is no add-stock control or add-stock link on the Bills form
- [ ] A server insufficient-stock or duplicate refusal is surfaced on the save
- [ ] A successful save invalidates the products query
- [ ] Vitest cases cover duplicate Products, the stock message, edit-aware availability, and legacy availability
- [ ] The Bills list, Bill view, printed Bill, Export, Orders, and preview totals are unchanged

## Blocked by

- [01 — Take stock on Bill create and update](01-take-stock-on-bill-create-and-update.md)
