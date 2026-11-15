# Bill line is one product at one rate

Status: accepted

Supersedes in part: [ADR-0026](0026-bills-deduct-stock-on-create-and-reconcile-on-update.md) — only the sentence that the same product may not appear twice on one Bill.

A Bill line is one Product at one rate. The same Product may appear on another line when the rate differs. The rate is normalized half up to the paise before comparison, so 220, 220.0, and 220.00 are one rate, and 220.5 and 220.50 are one rate. Tax percents, tax code, quantity, and the copied product name are not part of the identity. The same Product at the same rate is refused on create and update with `BillDuplicateProductError`. There is no automatic merge.

Stock in hand stays one pool per Product. Creating compares the sum of kept quantities for that Product. Updating compares the difference between the new sum and the old sum. The guarded stock update still applies one difference per Product. Bills and Orders share the pool.

The rejected alternatives were allowing a second line only when the tax copy differs, merging same-rate pairs automatically, checking each line's quantity independently against the full stock in hand, and keeping the old one-product-per-Bill rule. Orders stay one line per Product.