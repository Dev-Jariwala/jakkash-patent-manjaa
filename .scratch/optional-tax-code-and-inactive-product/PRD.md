Status: ready-for-agent

# Optional tax code and inactive product PRD

## Problem Statement

Every product must name an HSN or a SAC before it can be saved. Goods that are sold on an Order and never raised on a Bill are blocked by a tax code they do not need. A product that should no longer be chosen still sits in the Order, Bill, and stock-in lists, because the products screen has no way to turn it off. The unused delete flag is not that control.

## Solution

HSN/SAC on a product becomes optional. A product may be saved with none, and an existing code may be cleared. When a code is chosen, category Product still names an HSN and Labour still names a SAC. A new product starts active. The product form can mark it inactive, and the products list shows that status, including inactive rows.

An inactive product stays on the products list. It cannot be newly chosen on an Order, a Bill, or stock-in. An Order, a Bill, or a stock entry that already names it keeps that line, and the line can still be saved. A new collection copies active products only. An Order still shows every active product whose price for that sale is above zero, with or without an HSN/SAC. A Bill still offers only active products that have an HSN/SAC. Purchases stay a supplier record and do not gain a product.

## User Stories

1. As an operator, I want to save a new Product with no HSN, so that a good I only sell on an Order is not blocked by a tax code.
2. As an operator, I want to save new Labour with no SAC, so that labour I only sell on an Order is not blocked either.
3. As an operator, I want that save to succeed without being told that HSN/SAC is required, so that an empty tax code is a valid product.
4. As an operator, I want to choose an HSN on a Product, so that a Bill can still copy a goods code.
5. As an operator, I want to choose a SAC on Labour, so that a Bill can still copy a service code.
6. As an operator, I want a Product saved with a SAC to be rejected, so that the category and the type stay matched when a code is chosen.
7. As an operator, I want Labour saved with an HSN to be rejected, so that the other mismatch is rejected too.
8. As an operator, I want that rejection to say a product must use an HSN, or labour must use a SAC, so that I know which rule failed.
9. As an operator, I want an unknown tax code to be rejected, so that the product names a real Masters row when it names one.
10. As an operator, I want to clear the HSN on a Product I already saved, so that I can take it off Bills without deleting the product.
11. As an operator, I want to clear the SAC on Labour I already saved, so that the same correction works for labour.
12. As an operator, I want that product to read back with no tax code, so that the clear is what was stored.
13. As an operator, I want switching the category to clear a tax code of the other type, so that I cannot save a Product that still names a SAC, or Labour that still names an HSN.
14. As an operator, I want the product form to have no CGST, SGST, or IGST fields, so that rates stay on the tax code and on the Bill.
15. As an operator, I want the product to keep the name, prices, category, and stock it already has, so that making the tax code optional does not replace those fields.
16. As an operator, I want two products to be allowed to name the same tax code, so that one HSN can still be used by more than one product.
17. As an operator, I want the products list to show the type and the code, so that I can see which code a product names.
18. As an operator, I want that cell to be blank when the product has no tax code, so that an empty code is not shown as if it had one.
19. As an operator, I want a way to set the HSN/SAC control back to empty, so that I can clear a code without a trick.
20. As an operator, I want a product that already has no tax code to stay valid, so that today's products are not forced to gain one.
21. As an operator, I want a new product to start active, so that I do not have to turn it on before I can sell it.
22. As an operator, I want to mark a product inactive when I create it, so that I can enter it without offering it for sale yet.
23. As an operator, I want to mark an existing product inactive, so that I can stop new use of it.
24. As an operator, I want to mark an inactive product active again, so that I can bring it back.
25. As an operator, I want the products list to show Active or Inactive on each row, so that I can tell them apart without opening the form.
26. As an operator, I want an inactive product to stay on that list, so that I can find it and turn it back on.
27. As an operator, I want no separate delete button for this, so that inactive is the control I use.
28. As an operator, I want the old unused delete flag to stay unused, so that inactive is not a hidden delete.
29. As an operator, I want Labour and a Product to follow the same active rule, so that category does not change who can be turned off.
30. As an operator, I want a new Order to show an active product that has no HSN/SAC, when its price for that sale is above zero, so that I can sell it without a tax code.
31. As an operator, I want a retail Order to use the retail price for that test, and a wholesale Order to use the wholesale price, so that the price rule I already have stays.
32. As an operator, I want a product whose price for that sale is zero to stay off the Order, so that a zero price is still not a sale.
33. As an operator, I want an inactive product to stay off a new Order, so that I cannot start a sale of it.
34. As an operator, I want an inactive product that is already on an Order to remain on that Order when I open it, so that I can still correct the sale.
35. As an operator, I want to change that line's quantity and save, so that a correction is not blocked by inactive.
36. As an operator, I want to change the Order's date and that line's price and save, so that those corrections are not blocked either.
37. As an operator, I want the usual stock check to still apply when I raise that quantity, so that inactive does not let me sell stock the shop does not have.
38. As an operator, I want an inactive product that is not already on this Order to have no row, so that I cannot add it by typing a quantity.
39. As an operator, I want removing that product from the Order to keep it off until I make it active again, so that taking it off is final for this sale.
40. As an operator, I want an Order to stay without HSN/SAC, so that this work does not put a tax code on the sale.
41. As an operator, I want a new Order that names an inactive product to be rejected even if the screen is bypassed, so that the list is not the only guard.
42. As an operator, I want that rejection to say the product is inactive, so that I know to turn it back on or pick another product.
43. As an operator, I want saving an Order that already names an inactive product to succeed, so that the bypass guard has the same exception as the screen.
44. As an operator, I want a new Bill's product list to offer only active products that have an HSN/SAC, so that I cannot start a line from a product that has none or is inactive.
45. As an operator, I want an active product with no tax code to stay off that list, so that the Bill rule I already have stays.
46. As an operator, I want an inactive product that has a tax code to stay off a new Bill, so that inactive wins over having a code.
47. As an operator, I want a new Bill line whose product has no HSN/SAC to be rejected, so that a product I have not given a code cannot be charged.
48. As an operator, I want that rejection to say the product has no HSN/SAC, so that I know to set it on the product.
49. As an operator, I want a new Bill line whose product is inactive to be rejected, so that a bypass cannot bill it.
50. As an operator, I want that rejection to say the product is inactive, so that I do not mistake it for a missing tax code.
51. As an operator, I want an inactive product that also has no tax code to be rejected as inactive, so that the first reason I hear is the one I can fix by turning it on.
52. As an operator, I want a Bill line that already names an inactive product to stay when I open the Bill, so that I can correct the Bill.
53. As an operator, I want that product to stay available in the line's product control, so that I can leave it selected and save.
54. As an operator, I want to change that line's quantity and save, so that a correction is not blocked.
55. As an operator, I want the Bill's stock check to still apply to that quantity, so that inactive does not oversell.
56. As an operator, I want choosing a different product, then trying to come back to the inactive one, to be impossible, so that leaving the line is final until the product is active again.
57. As an operator, I want a Bill raised while Cotton named an HSN to keep that copied code after I clear Cotton's tax code, so that the old Bill is not rewritten.
58. As an operator, I want saving that Bill without choosing Cotton again to keep the copied code, so that a date or rate correction does not demand a new tax code.
59. As an operator, I want choosing Cotton again, after the code was cleared, to be rejected, so that a fresh choice still needs an HSN/SAC.
60. As an operator, I want choosing Cotton again, while Cotton still names a code, to copy that current code, so that the fresh-choice rule I already have stays.
61. As an operator, I want a line whose submitted tax code is not the product's tax code to be rejected on a new choice, so that a disabled field cannot be bypassed.
62. As an operator, I want the Bill's tax shape, percents, bank block, and receiver copy to stay as they are, so that this work does not reopen those rules.
63. As an operator, I want stock-in to offer only active products, so that I cannot receive stock for a product I turned off.
64. As an operator, I want a new stock entry for an inactive product to be rejected, so that the screen is not the only guard.
65. As an operator, I want that rejection to say the product is inactive, so that I know why the receipt failed.
66. As an operator, I want an existing stock entry to keep its product, so that I can still change the quantity and the date.
67. As an operator, I want that product control to stay locked on the update, so that I cannot switch the entry onto another product.
68. As an operator, I want the stock in hand of an inactive product to stay where it is, so that turning a product off does not wipe what the shop holds.
69. As an operator, I want creating a collection to copy active products only, so that a product I turned off does not reappear in the new collection.
70. As an operator, I want an inactive product that has an HSN to be left out of that copy, so that having a tax code does not sneak it in.
71. As an operator, I want an active product with no HSN/SAC to be copied, still without a code, so that the new collection matches the catalogue I can already sell.
72. As an operator, I want each copy's prices and stock to start at 0, so that the copy rule I already have stays.
73. As an operator, I want the source collection's products to stay as they are, so that the copy does not turn them off or clear their codes.
74. As an operator, I want a purchase to stay a supplier record with no product, so that inactive does not add a product field there.
75. As an operator, I want the product report to stay as it is, so that past sales of a product are not hidden because I later marked it inactive.
76. As an operator, I want search on the products list to stay by product name, so that this work does not add a search by HSN/SAC.
77. As an operator, I want every product already saved to start active, so that today's catalogue does not disappear from Orders and Bills.
78. As a developer, I want the glossary to say a product may name one tax code, and that Product names an HSN and Labour names a SAC only when it does, so that a later reader does not make the code required again.
79. As a developer, I want the glossary to add Inactive product as a product the operator has turned off, still listed, and not available for a new choice, so that inactive is not called deleted.
80. As a developer, I want the glossary to avoid deleted and the unused delete flag for that term, so that the old flag is not revived as the meaning.
81. As a developer, I want the Tax code entry to say a product may name one tax code by id, so that the old sentence does not require one.
82. As a developer, I want one decision that the tax code on a product is optional, so that a later reader does not restore the required check from the older decision.
83. As a developer, I want that decision to keep the Bill line copy, the category match when a code is present, no rates on the product, and no HSN/SAC on an Order, so that only the required check is reversed.
84. As a developer, I want one decision that an inactive product stays on the products list, is left out of a collection copy, and cannot be newly chosen, so that a later reader does not copy every product again.

## Implementation Decisions

- The product module is the only place that decides whether a tax code is present, whether a product is active, and which products a collection copy includes. Create, update, read, list, and copy go through it. It does not write Bills, Orders, tax codes, or stock movements.
- A product stores the tax code id only. Empty means no tax code. It does not store the type, the code, the description, or the three rates. A read joins the Masters row when an id is present, and reads back with those empty when it is not.
- Create and update accept a missing tax code and store none. They still reject an unknown id. They still reject a SAC on a Product and an HSN on Labour, with the message that a product must use an HSN or labour must use a SAC. The category check runs only when a code is present. Switching category still clears a code of the other type before save.
- A product stores whether it is active. Existing products become active. Create and update accept the choice. When the choice is omitted, the product is active. The unused delete flag is not read or written by this work.
- The products list returns active and inactive products. It does not filter them out. Each row includes the active choice, and the type and code when a tax code is present.
- Collection copy includes active products only. An inactive product is skipped even when it has a tax code. An active product with no tax code is copied with none. Wholesale price, retail price, stock in hand, and total stock on each copy are 0. The source collection is not updated.
- The product form keeps name, prices, and category. HSN/SAC is not required and can be set back to empty. Active or Inactive is a choice on create and on edit, in the same kind of control as category, defaulting to Active. There are no percent fields. The products list shows the type and code, blank when there is none, and shows Active or Inactive. It has no delete control for this.
- The product module exposes one choice rule. An inactive product cannot be newly chosen. A product already on the document can. Order create and stock-in create call it and reject with the message that the product is inactive. Order update calls it and allows a product that is already on that Order. Stock-in update does not call it for a new choice, because the product on an existing stock entry stays the one already stored.
- An Order's rows are the active products in the collection whose price for that sale is above zero: retail price on a retail Order, wholesale price on a wholesale Order. On edit, a product already on the Order is included even when it is now inactive. A product that is inactive and not already on the Order is absent. The Order does not show or store HSN/SAC. The stock check and the zero-price check stay.
- A Bill's product list offers products in this collection that are active and have a tax code. On edit, the line's current product stays in that line's control even when it is inactive or has no tax code, labeled with the name copied on the line. A new line, and a line whose product was chosen again, rejects an inactive product before it complains about a missing tax code. A new line whose product is active and has no tax code is still rejected with the message that the product has no HSN/SAC. A submitted tax code that is not the product's current one is still rejected on a new choice. A line whose product id is unchanged and whose product was not chosen again keeps the stored tax code id, code, and description, even if the product is now inactive or the tax code was cleared. The Bill's stock check still applies to the quantity. Tax shape, percents, the bank block, the receiver copy, and the bill number are unchanged.
- Stock-in offers active products only. Creating a stock entry for an inactive product is rejected with the message that the product is inactive. Updating a stock entry keeps its product and may change quantity and date. Turning a product inactive does not change stock in hand.
- Purchases do not name a product. They are not given one.
- The product report, name search, Order PDF, Bill PDF, and Export are unchanged.
- The glossary changes Product so a tax code is optional and the HSN or SAC match applies only when a code is present. It adds Inactive product: a product the operator has turned off, still on the products list, not available for a new choice on an Order, a Bill, or stock-in, and left out of a collection copy. Avoid deleted and the unused delete flag. The Tax code entry says a product may name one tax code by id.
- Two decisions are recorded. The first says the tax code on a product is optional, and records that the older decision's rejected alternative is now the rule, while the Bill line copy, the category match when a code is present, no rates on the product, and no HSN/SAC on an Order still hold. The second says an inactive product stays on the products list, is left out when a collection is copied, and cannot be newly chosen. The older collection-copy decision's "every product" is narrowed by that second decision. Prices and stock on a copy still start at 0.

## Testing Decisions

- A good test asserts the outcome an operator would notice: a product was saved with no tax code, a code was cleared, a mismatch was rejected, an inactive product was saved and still listed, a collection copy left it out, a new Bill line was rejected, or an existing Bill line still saved. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There are two seams. The product module is the seam for the tax code, the active choice, the choice rule, and collection copy. Tests call create, update, list, and copy with the in-memory stand-in already used for products. The bill module is the seam for a Bill line. Tests call create and update with the in-memory stand-in already used for Bills. They do not open a database, boot HTTP, or render the screen.
- The product suite stops expecting a missing tax code to be rejected. It covers a Product and Labour saved with no tax code, a cleared code on update, a Product saved with an HSN, Labour saved with a SAC, rejection of an unknown tax code, rejection of a SAC on a Product, rejection of an HSN on Labour, a list that shows the type and code, a blank type and code when the product has none, a product saved inactive, a new product that is active when the choice is omitted, a list that still includes an inactive product, a collection copy that skips an inactive product and still copies an active product with no tax code, and the choice rule rejecting an inactive product that is not already on the document while allowing one that is.
- The bill suite keeps the outcomes it already has. It adds a new line rejected because the product is inactive, a new line rejected as inactive when the product is inactive and also has no tax code, a new line whose product is active and has no tax code still rejected because it has no HSN/SAC, an edit that saves a line whose product is now inactive when the product was not chosen again, and an edit that keeps the copied code after the product's tax code was cleared when the product was not chosen again.
- Orders and stock-in do not get their own suites. They call the product choice rule, which the product suite tests. No new frontend test suite. There is no HTTP or live-database harness to extend.
- Prior art is the product suite and the bill suite, both node:test with an in-memory stand-in.

## Out of Scope

- Purchases, including any new product field on a purchase.
- The product report.
- Search by HSN/SAC.
- Showing HSN/SAC on an Order, or copying it onto an Order line.
- Changing the rule that a zero price for that sale stays off the Order.
- The Order PDF, the Bill PDF, print preview, and Export.
- WhatsApp send, resend, or a delivery status.
- Wiring the unused delete flag, or hiding inactive products from the products list.
- Wiping stock in hand when a product is marked inactive.
- Waiving the stock check on an Order or a Bill because the product is inactive.
- Storing CGST, SGST, or IGST on the product.
- Deleting a tax code, changing its type, or changing the rate rule on Masters.
- A third test seam for HTTP, the product screen, the Order screen, the Bill screen, or stock-in.
- Rewriting the older product tax code PRD. The new decisions supersede the parts they name.

## Further Notes

- The older decision rejected an optional tax code on the product. This PRD reverses that one alternative and leaves the rest of that decision in place.
- The older collection-copy decision included every product. This PRD leaves inactive products out and still copies an active product that has no tax code.
- A purchase was checked and does not name a product, so the inactive rule has nowhere to apply there.
- The glossary and the two decisions are part of this work, not a precondition already on disk.
