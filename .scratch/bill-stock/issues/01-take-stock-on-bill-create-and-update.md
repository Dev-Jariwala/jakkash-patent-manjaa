Status: ready-for-agent

## Parent

[Bill stock PRD](../PRD.md)

## What to build

Creating a Bill takes every kept line out of stock in the active collection. A line whose quantity is greater than the Product's stock in hand is refused, including a Product with 0 stock. Labour is treated like any Product: it is checked and deducted. The same Product may not appear on two lines of one Bill.

Editing a Bill reconciles stock. The Bill's stored quantities are given back, then the submitted quantities are taken, so the net change is new minus old. Increasing a line from 2 to 5 takes 3. Reducing 5 to 2 returns 3. Removing a line returns its quantity. Adding a line takes its quantity. Changing a line's Product returns the old Product's quantity and takes the new Product's quantity. An edit that needs more than current stock plus the Bill's own old quantity is refused.

Bills saved before this change never deducted stock. They are not backfilled. Migration `015` adds `stock_applied BOOLEAN NOT NULL DEFAULT FALSE` to `gst_bills`; existing rows are false and new rows are written true. A legacy Bill's first save takes only its new quantities and marks it applied. Later edits reconcile normally. A legacy Bill never restores stock it never took.

The Bill row, its lines, and the stock deltas commit or roll back together. A positive delta is applied with a guarded `UPDATE products SET stock_in_hand = stock_in_hand - $delta WHERE product_id = $1 AND collection_id = $2 AND stock_in_hand >= $delta`. Zero rows affected means insufficient stock and rolls the transaction back. Two concurrent Bills cannot oversell. Only `stock_in_hand` moves; `total_stock` is unchanged.

The rules live in `services/bill.js` and take injectable deps. The SQL and transaction live in `services/billStore.js`. `getProductById` returns `stock_in_hand`, and `formatBillRow` exposes `stock_applied`. Insufficient stock raises `BillInsufficientStockError` (400, `BILL_INSUFFICIENT_STOCK`); a duplicate Product raises `BillDuplicateProductError` (400, `BILL_DUPLICATE_PRODUCT`). Preview totals, the Bills list, the printed Bill, Export, and Orders are unchanged. The Bill form is the next slice.

## Acceptance criteria

- [ ] Migration `015` adds `stock_applied` to `gst_bills`, defaulting to false for existing rows
- [ ] Creating a Bill deducts each kept line's quantity from `products.stock_in_hand` and writes `stock_applied = true`
- [ ] Creating a Bill refuses a line whose quantity exceeds stock in hand, and no Bill or stock change is written
- [ ] A Product with 0 stock is refused
- [ ] Labour is checked and deducted exactly like a Product
- [ ] The same Product on two lines is refused on create with a clear message
- [ ] The same Product on two lines is refused on update with a clear message
- [ ] An existing Bill with duplicate Products refuses any save until the operator removes the extra line
- [ ] Editing a Bill gives back the stored quantities and takes the submitted quantities, so stock changes by the net amount
- [ ] Increasing a line takes only the increase, reducing returns the difference, removing returns the whole quantity, and adding takes the whole quantity
- [ ] Changing a line's Product restores the old Product and deducts the new Product
- [ ] An edit is refused when the new quantity exceeds current stock plus the Bill's own old quantity
- [ ] A legacy Bill's first save deducts only its new quantities, does not restore old ones, and sets `stock_applied = true`
- [ ] A legacy Bill's later edit reconciles normally
- [ ] The Bill row, lines, and stock deltas are one transaction and roll back together on failure
- [ ] A guarded `UPDATE` that affects zero rows produces `BillInsufficientStockError` and no partial write
- [ ] Only `stock_in_hand` moves; `total_stock` is unchanged
- [ ] `getProductById` returns stock in hand and `formatBillRow` returns `stock_applied`
- [ ] `previewBillTotals`, list, read, Export, and Orders are unchanged
- [ ] Domain tests extend `createBillWorld` and cover create, insufficient stock, 0 stock, Labour, duplicate create/update, existing duplicates, increase, decrease, remove, add, Product change, the edit limit, and the legacy cutover
- [ ] A focused `billStore` test uses `__setQueryImplementationForTests` to prove the guarded `UPDATE` returning zero rows rolls back with the insufficient-stock error

## Blocked by

None — can start immediately
