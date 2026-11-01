Status: ready-for-agent

## Parent

[Optional tax code and inactive product PRD](../PRD.md)

## What to build

Creating a collection copies active products only. An inactive product is left out, including one that has an HSN or a SAC. An active product with no HSN/SAC is copied, still without a code. Each copy's wholesale price, retail price, stock in hand, and total stock start at 0. The source collection's products are not updated: they are not turned off, and their tax codes are not cleared.

The glossary's Inactive product entry says a new collection leaves it out. One decision records that an inactive product stays on the products list, is left out of a collection copy, and cannot be newly chosen, so a later reader does not copy every product again. Prices and stock on a copy still start at 0.

## Acceptance criteria

- [ ] A new collection copies active products and leaves inactive products out
- [ ] An inactive product that has a tax code is still left out
- [ ] An active product with no HSN/SAC is copied, still without a code
- [ ] Each copy's wholesale price, retail price, stock in hand, and total stock are 0
- [ ] The source collection's products are unchanged
- [ ] Product tests, using the in-memory stand-in, cover an inactive product skipped and an active product with no tax code copied
- [ ] The glossary says an inactive product is left out of a collection copy
- [ ] The inactive-product decision is recorded, including the collection-copy rule

## Blocked by

- [02 — Mark a product inactive](02-mark-a-product-inactive.md)
