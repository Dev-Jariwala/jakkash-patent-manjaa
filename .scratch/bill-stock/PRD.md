Status: ready-for-agent

# Bill stock PRD

## Problem Statement

A Bill records a GST sale, but saving one leaves stock untouched. Only Orders take stock out of `products.stock_in_hand`, so a shop that raises Bills sees stock that never goes down. The Bills form also has no idea what is in stock, and it allows the same product on more than one line, which makes a stock deduction ambiguous. The glossary and ADR-0016 currently say a Bill deliberately does not move stock, so this is a reversal of the existing model, not just a missing field.

## Solution

Creating a Bill takes its lines out of stock in the active collection, from the same stock pool Orders use. Every kept line is checked against stock in hand and a line that asks for more than is available refuses the save. Labour counts like any Product. The same Product cannot appear twice on one Bill. Editing a Bill gives back the quantities stored on it and takes the new ones, so the net change is new minus old. Bills saved before this change are not backfilled; their first save takes only the new quantities and marks them applied. The Bill, its lines, and the stock change commit or roll back together, and the deduction is guarded so two concurrent saves cannot oversell the last item. The Bills form shows stock in hand per line and refuses inline. There is no add-stock control on Bills; stock is received on the Stocks screen only. The Bills list, the printed Bill, Export, and Orders are unchanged.

## User Stories

1. As an operator, I want creating a Bill to reduce stock in hand for each Product on it, so that Bills and Orders share one stock truth.
2. As an operator, I want stock checked before a Bill is saved, so that I cannot bill goods the shop does not have.
3. As an operator, I want a Bill line of quantity 5 refused when only 3 are in stock, so that the shortage is visible before the save.
4. As an operator, I want a Product with 0 stock refused on a Bill, so that an out-of-stock item cannot be billed.
5. As an operator, I want Labour treated like any Product, so that the stock rule has no category exception.
6. As an operator, I want a Labour item with 0 stock refused, so that Labour follows the same rule as a Product.
7. As an operator, I want the same Product refused twice on one Bill, so that the stock for that Product is unambiguous.
8. As an operator, I want that duplicate refusal on create and on edit, so that a stale screen cannot slip a duplicate through.
9. As an operator, I want an existing Bill with duplicate Products refused until I fix it, so that the rule has no hidden exception.
10. As an operator, I want editing a Bill to give back its old quantities before taking the new ones, so that an ordinary edit does not lose stock.
11. As an operator, I want changing a line from quantity 2 to 5 to take only the extra 3, so that the net stock is right.
12. As an operator, I want reducing a line from 5 to 2 to return 3 to stock, so that the correction is reflected.
13. As an operator, I want removing a line to return its quantity, so that a deleted line does not stay deducted.
14. As an operator, I want adding a line to take its quantity, so that a new line is accounted for.
15. As an operator, I want changing a line's Product to return the old Product's quantity and take the new Product's quantity, so that both Products are right.
16. As an operator, I want an edit that needs more than current stock plus the Bill's own old quantity refused, so that the guard is about the net change.
17. As an operator, I want the Bill and its stock change to succeed or fail together, so that a failed save leaves neither half a Bill nor half a stock change.
18. As an operator, I want two Bills saved at the same time not to oversell the last item, so that concurrent saves are safe.
19. As an operator, I want only stock in hand to move, so that the lifetime received total stays a lifetime total.
20. As an operator, I want a Bill saved before this change not to backfill stock, so that history is not rewritten.
21. As an operator, I want the first edit of such a Bill to take only its new quantities, so that stock is not inflated by a restore that never happened.
22. As an operator, I want that Bill marked as stock-applied after its first save, so that later edits reconcile normally.
23. As an operator, I want the Bills form to show stock in hand per line, so that I can see the limit before typing a quantity.
24. As an operator, I want a line to show an inline error when its quantity exceeds stock, so that I do not learn only after submit.
25. As an operator, I want the inline limit on an edit to include the Bill's own already-deducted quantity, so that I can keep the same quantity.
26. As an operator, I want the inline limit on a legacy Bill to use current stock only, so that the form matches the cutover rule.
27. As an operator, I want the form to refuse duplicate Products inline, so that I fix the line before submit.
28. As an operator, I want the server to re-check stock on save, so that a stale form cannot oversell.
29. As an operator, I want a clear insufficient-stock message naming the Product, available, and requested, so that I know what to do.
30. As an operator, I want no add-stock control on Bills, so that stock is received on the Stocks screen only.
31. As an operator, I want the totals preview to stay a money calculation, so that typing does not produce stock errors.
32. As an operator, I want the Bills list and printed Bill unchanged, so that stock does not add a column or change the PDF.
33. As an operator, I want Orders unchanged, so that this change does not reopen the order flow.
34. As an operator, I want the same physical sale not recorded as both an Order and a Bill, so that stock is not taken twice.
35. As an operator, I want the glossary to say a Bill takes Products out of stock, so that the language matches the behaviour.
36. As an operator, I want a decision record that reverses the old "Bill does not move stock" rule, so that the next reader knows why.
37. As an operator, I want that decision to record the cutover and the duplicate rule, so that the exceptions are not folklore.
38. As an operator, I want the rejected alternatives recorded, so that backfill and per-line checks are not proposed again.

## Implementation Decisions

- **One shared stock pool.** Orders and Bills both deduct `products.stock_in_hand`. A physical sale is recorded as either an Order or a Bill, never both; the code does not enforce that, it is shop practice.
- **Every kept line is stock-checked and deducted**, including Labour. A line whose quantity exceeds stock in hand is refused with `BillInsufficientStockError` (400, `BILL_INSUFFICIENT_STOCK`).
- **Duplicate Products are refused** on create and update with `BillDuplicateProductError` (400, `BILL_DUPLICATE_PRODUCT`). Existing Bills that already contain duplicates refuse any save until the operator removes the extra line. There is no merge migration.
- **Create:** build the new quantity per Product from the kept lines, validate each against `stock_in_hand`, deduct them, and set `stock_applied = true` on the Bill.
- **Update:** build `oldQty` per Product from the stored Bill only when `stock_applied` is true; otherwise treat it as empty. Build `newQty` from the submitted lines. `delta = newQty - oldQty`. Validate every positive delta against current `stock_in_hand`, which is the same as `newQty <= stock_in_hand + oldQty`. Apply the deltas and set `stock_applied = true`.
- **Atomic guarded deduction.** The Bill row, its lines, and the stock deltas run in one database transaction. A positive delta is applied with `UPDATE products SET stock_in_hand = stock_in_hand - $delta WHERE product_id = $1 AND collection_id = $2 AND stock_in_hand >= $delta`. Zero rows affected means insufficient stock and rolls the transaction back. A negative delta restores stock with an unguarded `stock_in_hand = stock_in_hand + $restore`.
- **Only `stock_in_hand` moves.** `total_stock` keeps its meaning as the lifetime received quantity, exactly as Orders leave it.
- **Cutover marker.** Migration `015` adds `stock_applied BOOLEAN NOT NULL DEFAULT FALSE` to `gst_bills`. New Bills are written with `true`. Existing Bills are `false` and are not backfilled.
- **Placement.** `services/bill.js` owns the duplicate, availability, and delta rules and takes injectable deps. `services/billStore.js` owns the SQL and the transaction. `getProductById` returns `stock_in_hand`, and `formatBillRow` exposes `stock_applied`.
- **Preview totals stays money-only.** `POST /gst-bills/preview-totals` does not check stock.
- **Bill form.** Product options carry `stock_in_hand`. Each line shows available stock and validates quantity inline. On an edit, availability includes the Bill's own already-deducted quantity only when `stock_applied` is true and the line's Product is unchanged. The form refuses duplicate Products inline. The server re-checks atomically. There is no add-stock control. A successful save invalidates the products query.
- **Unchanged:** Bills list, Bill view, printed Bill, Export, and Orders.
- **Glossary.** Bill now says it takes the Products it names out of stock. Stock in hand is added as a term. ADR-0026 supersedes ADR-0016.

## Testing Decisions

- A good test asserts what an operator would notice: a Bill saved and stock went down, a save was refused with a clear reason, an edit changed stock by the net amount, a legacy Bill did not inflate stock on its first save, a duplicate was refused, or the store guard stopped a second deduction.
- There is one domain seam: the bill module. Tests call create and update with the in-memory `createBillWorld`, extended with stock in hand and `stock_applied`. They do not open a database, boot HTTP, or render the screen.
- The suite covers: create deducts; create refuses quantity above stock; create refuses 0 stock; Labour is deducted like a Product; duplicate create; duplicate update; an existing duplicate Bill is refused; update increase takes only the delta; update decrease restores; remove restores; add deducts; Product change restores the old and deducts the new; an edit is limited to current stock plus the Bill's old quantity; a legacy Bill's first save deducts only the new quantities and marks it applied; a later legacy edit reconciles normally; preview totals and list are unchanged.
- The guarded update gets one focused `billStore` test using `__setQueryImplementationForTests`, where the guarded `UPDATE` returns zero rows and the transaction is expected to roll back with the insufficient-stock error.
- The Bill form validation gets Vitest cases for duplicate Products, the stock message, edit-aware availability, and legacy availability.
- No database integration suite, no PDF rendering, and no new HTTP seam.

## Out of Scope

- Backfilling stock for Bills saved before this change.
- An add-stock control on Bills, or opening the Orders add-stock modal from a Bill.
- Any change to Orders, including their validators, stock writes, or add-stock flow.
- Changing the meaning of `total_stock`.
- Stock reservations, transfers, or allowing stock to go negative.
- Changing the Bills list, Bill view, printed Bill, or Export.
- A second stock pool for Bills.
- Automatically preventing the same sale from being recorded as both an Order and a Bill.
- Migrating or merging duplicate lines on existing Bills.
- Seeding stock for Labour products.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- This reverses ADR-0016. The old decision stays in place with a note pointing at ADR-0026.
- Treating Labour like any Product means a Labour item needs stock before it can be billed. That is a deliberate consequence, not a bug.
- The service pre-check gives the friendly message; the guarded `UPDATE` is the authoritative race-safe check.
