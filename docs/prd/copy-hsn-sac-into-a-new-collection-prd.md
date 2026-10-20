Status: ready-for-agent

# Copy HSN/SAC into a new collection PRD

## Problem Statement

An operator creates 2026-2027 from Default and ticks Include all products. The products appear in the new collection, but each one has no HSN/SAC. Forty products then have to be opened one by one before they can be used on a Bill. The copy also marks every product as Product, so a Labour row loses the category that goes with its SAC.

While setting those codes, the operator edits a product whose serial is about P-46. After save, that row is no longer in front of them. The total number of products has not changed. The list opened again on the first page, and the order can shuffle because a copied set was created together.

## Solution

Include all products copies each product's name, category, and tax code into the new collection. A Product keeps its HSN. Labour keeps its SAC. A product with no tax code is copied without one. Wholesale price, retail price, stock in hand, and total stock on the copy are 0. The collection the products were copied from keeps its prices, its stock, and its tax codes.

The products list is ordered by serial number, which an edit does not change. The list remembers the page and the page size for the collection that is open, so saving P-46 brings the operator back to the page where P-46 is. Search by name stays as it is.

This replaces the note in the Product tax code PRD that copying products into a new collection is out of scope. The rest of that PRD stands.

## User Stories

1. As an operator, I want Include all products to copy Cotton's name into 2026-2027, so that I do not type the catalogue again.
2. As an operator, I want Cotton to stay a Product on that copy, so that the category is the one I already set.
3. As an operator, I want Cotton's copy to name the same HSN, so that I do not pick the code again.
4. As an operator, I want Stitching to stay Labour on that copy, so that a service is not turned into goods.
5. As an operator, I want Stitching's copy to name the same SAC, so that Labour still has the code that matches its category.
6. As an operator, I want a product with no tax code to be copied without one, so that a gap in the old collection is not filled in by guesswork.
7. As an operator, I want the copy's wholesale price to be 0, so that the new collection does not inherit last year's price.
8. As an operator, I want the copy's retail price to be 0, so that both prices start empty.
9. As an operator, I want the copy's stock in hand to be 0, so that metres counted in Default stay in Default.
10. As an operator, I want the copy's total stock to be 0, so that stock is not moved by creating a collection.
11. As an operator, I want Default's Cotton to keep its price, its stock, and its HSN, so that the collection I copied from is unchanged.
12. As an operator, I want the new product to store the tax code id, so that it follows the same Masters row the old product names.
13. As an operator, I want the copy not to store CGST, SGST, or IGST, so that rates stay on the tax code and on the Bill.
14. As an operator, I want two products that share one HSN to both keep that HSN, so that sharing a code still works after the copy.
15. As an operator, I want a product name that contains a quote or a comma to be copied intact, so that the name is data and not part of the save.
16. As an operator, I want Include all products left unticked to create an empty collection, so that I can still start a collection with no products.
17. As an operator, I want the products list in 2026-2027 to show the copied HSN or SAC, so that I can see the code without opening the product.
18. As an operator, I want a copied product with no tax code to show a blank HSN/SAC cell, so that a missing code is visible.
19. As an operator, I want the list ordered by serial number, lowest first, so that P-46 stays in the same place after I edit it.
20. As an operator, I want an edit that sets an HSN/SAC to leave the serial number unchanged, so that the row does not jump because I saved.
21. As an operator, I want to return to the same page after that save, so that P-46 is still the row in front of me.
22. As an operator, I want the page size I chose to still be the page size, so that a list of 50 does not snap back to 5.
23. As an operator, I want that remembered page to belong to the collection I have open, so that switching collection does not show me 2026-2027's page inside Default.
24. As an operator, I want the total count to stay the same after an edit, so that setting a tax code does not add or remove a product.
25. As an operator, I want search by product name to stay as it is, so that finding Cotton does not start matching on the HSN.
26. As an operator, I want a Bill in 2026-2027 to offer Cotton once Cotton's copy has an HSN, so that the copied code is enough to raise a Bill.
27. As an operator, I want a copied product with no tax code to stay off a new Bill line, so that the Bill rule is unchanged.
28. As an operator, I want Orders to be unchanged, so that a collection copy does not change a sale.
29. As a developer, I want one decision that the copy takes the name, the category, and the tax code, and that price and stock start at 0, so that a later reader does not copy the stock or drop the HSN.
30. As a developer, I want that decision to record the rejected alternative, copying the stock and both prices as well, so that the trade-off stays with the decision.
31. As a developer, I want the product module to be the only place that decides the copy and the list order, so that the collection screen does not invent a second rule.

## Implementation Decisions

- The product module is the only writer of the copy and of the list order. Creating a collection with Include all products calls it. The screen does not insert products itself.
- Each copied product stores the source product's name, category, and tax code id. Wholesale price, retail price, stock in hand, and total stock are 0. A product with no tax code is stored with no tax code id. Category Product is copied with its HSN. Labour is copied with its SAC. The id is the Masters row. Rates are not copied onto the product.
- The source collection's products are not updated. Their prices, stock, category, and tax code stay as they were.
- A product name is saved as a value. A quote or a comma in the name does not change the copy.
- Leaving Include all products unticked creates the collection with no products.
- The products list defaults to serial number, ascending. An edit does not change the serial number, so the row stays in that order. Search stays by product name.
- The list remembers the page and the page size for the collection that is open. Saving a product and returning to the list uses that page. Another collection has its own page.
- No glossary term changes. A product already names one tax code.
- One decision records that a collection copy takes the name, the category, and the tax code, and that price and stock start at 0. The rejected alternative is copying the stock and both prices as well.
- The Product tax code PRD's note that copying products into a new collection is out of scope is replaced by this document. A Bill still offers only products in the collection that have a tax code. Orders are unchanged.

## Testing Decisions

- A good test asserts the outcome an operator would notice: Cotton was copied with its HSN and with prices and stock at 0, Stitching was copied as Labour with its SAC, a product with no tax code was copied without one, Default still has its stock, or the list order is serial number so an edit does not move the row. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam: the product module. Tests call the copy and the list with an in-memory stand-in for products and tax codes. They do not open a database, boot HTTP, or render the screen.
- The suite covers Cotton copied as Product with the same HSN and with wholesale price, retail price, stock in hand, and total stock at 0, Stitching copied as Labour with the same SAC, a product with no tax code copied without one, two products that share an HSN both keeping it, a name that contains a quote copied intact, the source collection left unchanged, an empty copy when Include all products is off, and a list ordered by serial number that stays in that order after a tax code is set.
- No new frontend test suite. The screen still remembers the page and the page size. That memory is not a second seam. Order tests and Bill tests are unchanged.
- Prior art is the product module suite and its in-memory stand-in.

## Out of Scope

- Copying wholesale price, retail price, stock in hand, or total stock.
- Copying CGST, SGST, or IGST onto the product.
- Changing a product's serial number.
- Search by HSN/SAC.
- Soft delete and restore of a product.
- Any change to an Order, or to how a Bill copies a tax code onto a line.
- A second test seam for HTTP or for the products screen.

## Further Notes

- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way the Bill PRD records that role.
- The collection in the example is 2026-2027, copied from Default. Any other pair of collections follows the same rule.
- P-46 disappeared from the front of the list because the list returned to the first page and the order is not the serial number. The product was still in the collection. The total did not change because nothing was deleted.
