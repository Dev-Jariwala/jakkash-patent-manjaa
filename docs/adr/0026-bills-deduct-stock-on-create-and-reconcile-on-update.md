# Bills deduct stock on create and reconcile on update

Status: accepted

Supersedes: [ADR-0016](0016-bill-is-not-order-and-does-not-move-stock.md)

A Bill is a GST document typed in directly for one collection, and saving it now takes its Products out of stock in that collection. Bills and Orders share one stock pool, `products.stock_in_hand`; a physical sale is recorded as either an Order or a Bill, never both. Every line is checked, including Labour, and the same Product may not appear twice on one Bill. Creating deducts the lines. Editing gives back the stored quantities and deducts the new ones, so the net change is new minus old. The Bill, its lines, and the stock change commit or roll back together, and the deduction is guarded so concurrent saves cannot oversell the last item.

The one-product-per-Bill line rule is replaced by [ADR-0030](0030-bill-line-is-one-product-at-one-rate.md). Stock deduction, the cutover for Bills that never took stock, and the single guarded deduction per Product stay.

Bills saved before this decision never deducted stock. They are not backfilled: `stock_applied` is false for them, and their first save deducts only the new quantities and marks them applied. Backfilling would rewrite history and could double-count goods already recorded as Orders.

The rejected alternatives were backfilling every existing Bill, keeping Bills out of stock, checking each line independently so two lines can oversell, merging existing duplicate lines by migration, and adding an add-stock control to Bills. Stock is received on the Stocks screen only. The glossary now defines Stock in hand and says a Bill takes the Products it names out of stock.
