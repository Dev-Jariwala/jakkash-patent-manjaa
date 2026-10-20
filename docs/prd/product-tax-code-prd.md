Status: ready-for-agent

# Product tax code PRD

## Problem Statement

A product has no HSN/SAC. On a Bill the operator picks a product and a tax code as two separate choices, so the line can name a code the product does not use. Goods and labour can be given either kind of code. After a Bill is saved, the line already keeps its own copy of the code, but nothing stops a later edit of the product, or of the tax code on Masters, from being mistaken for a change to that old Bill.

## Solution

A product names one tax code. Category Product names an HSN. Labour names a SAC. The product does not keep rates. Create and edit require the tax code. Products already saved may lack one until the next edit. The products table shows the type and code, blank until then. The product follows the Masters row, so an edited code or description shows on the product.

On a Bill, choosing a product fills HSN/SAC from that product and the field stays disabled. CGST and SGST prefill from that tax code's current defaults, IGST starts at 0, and those percents stay editable. Choosing the product again, including the same product, takes a fresh copy and refills the percents, the same way the rate refills. A saved line keeps the copy from when the product was chosen. Opening the Bill and saving it without choosing the product again does not pick up a new tax code, a new code, or a new description. A Bill can only newly use a product that already has a tax code. An old line whose product still has none can stay. Orders do not show or copy HSN/SAC.

## User Stories

1. As an operator, I want an HSN/SAC select on the product form, so that the product names the code a Bill will use.
2. As an operator, I want that select to be required, so that a new product is not saved without one.
3. As an operator, I want a save with no HSN/SAC to be rejected and told that HSN/SAC is required, so that I know which field to fill.
4. As an operator, I want the select to offer tax codes, so that I choose a row from Masters rather than typing digits.
5. As an operator, I want each option to show the type, the code, and the description, so that I can tell two rows apart.
6. As an operator, I want an HSN and a SAC that share the same digits to both be choosable when the category allows them, so that the same digits are not treated as one row.
7. As an operator, I want category Product to offer only HSN, so that goods are not given a service code.
8. As an operator, I want Labour to offer only SAC, so that labour is not given a goods code.
9. As an operator, I want a Product saved with a SAC to be rejected, so that the category and the type stay matched.
10. As an operator, I want Labour saved with an HSN to be rejected, so that the other mismatch is rejected too.
11. As an operator, I want that rejection to say a product must use an HSN, or labour must use a SAC, so that I know which rule failed.
12. As an operator, I want an unknown tax code to be rejected, so that the product names a real Masters row.
13. As an operator, I want switching the category to clear a tax code of the other type, so that I cannot save a Product that still names a SAC, or Labour that still names an HSN.
14. As an operator, I want the product form to have no CGST, SGST, or IGST fields, so that the rates stay on the tax code and on the Bill.
15. As an operator, I want the product to keep the name, wholesale price, retail price, and category it already has, so that adding HSN/SAC does not replace those fields.
16. As an operator, I want stock to stay where it is, so that naming a tax code does not move stock.
17. As an operator, I want a product that already exists to stay without an HSN/SAC until I edit it, so that today's products are not blocked before I choose a code.
18. As an operator, I want editing that product to require an HSN/SAC before it saves, so that the next save is held to the same rule as a new product.
19. As an operator, I want to change which tax code a product names, so that a wrong code can be corrected.
20. As an operator, I want that change to be of the same type as the category, so that a correction cannot switch HSN and SAC.
21. As an operator, I want a saved product to show the code and description currently on that Masters row, so that the product follows the row rather than a frozen copy of the digits.
22. As an operator, I want an edit of that row's code on Masters to show on the product, so that Cotton pointed at the row now shows the new code.
23. As an operator, I want an edit of that row's description on Masters to show on the product select, so that the description follows the row too.
24. As an operator, I want the products table to show the type and the code, so that I can see which code a product names without opening it.
25. As an operator, I want that cell to be blank when the product has no tax code yet, so that a product I have not edited is not shown as if it had a code.
26. As an operator, I want two products to be allowed to name the same tax code, so that one HSN can be used by more than one product.
27. As an operator, I want a tax code used by a product to remain on Masters, so that this work does not add a way to delete a tax code.
28. As an operator, I want the type of a tax code to stay fixed, so that this work does not turn an HSN into a SAC.
29. As an operator, I want Orders to stay without HSN/SAC, so that the sale I already record does not gain a tax code.
30. As an operator, I want an Order to still use a product that has no tax code, so that naming a code is not required before I can sell.
31. As an operator, I want the Bill's HSN/SAC field to fill when I choose a product, so that I do not pick the code a second time.
32. As an operator, I want that field to stay disabled, so that this Bill cannot name a different tax code from the product.
33. As an operator, I want the disabled field to show the type and the code, so that I can see what was filled.
34. As an operator, I want the tax code's catalog description to stay off the Bill form, so that Description remains the product name.
35. As an operator, I want choosing a product to fill the rate with the wholesale price, so that the rate prefill I already have stays.
36. As an operator, I want choosing a product to fill CGST and SGST from the tax code's current defaults and set IGST to 0, so that a within-state line is still the usual case.
37. As an operator, I want to change those three percents after they are filled, so that this line can charge a different allowed shape.
38. As an operator, I want choosing the product again to fill the wholesale price again, so that a fresh choice replaces the rate I had typed.
39. As an operator, I want choosing the product again, including the same product, to copy that product's current HSN/SAC, so that a fresh choice replaces the code on the line.
40. As an operator, I want that fresh choice to fill CGST and SGST again and set IGST to 0, so that the percents follow the code I just took.
41. As an operator, I want the Bill's product list to offer only products in this collection that have an HSN/SAC, so that I cannot start a line from a product that has none.
42. As an operator, I want a product from another collection to be rejected, so that the line stays in this Bill's collection.
43. As an operator, I want a new line whose product has no HSN/SAC to be rejected, so that a product I have not given a code cannot be charged.
44. As an operator, I want that rejection to say the product has no HSN/SAC, so that I know to set it on the product.
45. As an operator, I want a line whose submitted tax code is not the product's tax code to be rejected, so that a disabled field cannot be bypassed.
46. As an operator, I want the saved line to keep a copy of the code and the catalog description from the tax code at save time, so that the line does not depend on the wording I did not type.
47. As an operator, I want the percents I changed to be the percents that are saved, so that the prefill is only a starting value.
48. As an operator, I want CGST 2.5, SGST 2.5, and IGST 0 to save, so that the usual within-state line is still accepted.
49. As an operator, I want CGST 0, SGST 0, and IGST 0 to save, so that an exempt line is still accepted.
50. As an operator, I want CGST 0, SGST 0, and IGST 5 to save, so that I can still type an outside-state line by hand.
51. As an operator, I want CGST 2.5, SGST 2.5, and IGST 5 to be rejected, so that a line still does not charge both shapes.
52. As an operator, I want unequal CGST and SGST, with IGST 0, to be rejected, so that the two halves stay equal.
53. As an operator, I want the same product on two lines of one Bill to save, so that two lines are not blocked for sharing a product.
54. As an operator, I want a Bill raised for Cotton with HSN 520910 to keep 520910 after Cotton is pointed at HSN 520911, so that the old Bill is not rewritten.
55. As an operator, I want that same Bill to keep 520910 after the Masters row's code is edited to 520912, so that a catalog edit does not rewrite the old Bill.
56. As an operator, I want that same Bill to keep the catalog description copied at save time after the description is edited on Masters, so that the hidden description on the line stays the one that was charged.
57. As an operator, I want opening that Bill to show the copied type and code, not Cotton's current tax code, so that the disabled field matches what was saved.
58. As an operator, I want the percents on that opened Bill to be the percents that were saved, so that a new default rate on Masters does not refill them by itself.
59. As an operator, I want saving that Bill without choosing the product again to keep the copied code and description, so that a date or rate correction does not take a new tax code.
60. As an operator, I want those saved percents to stay as I submitted them on that save, so that a percent I edit is kept and a percent I leave is not replaced from Masters.
61. As an operator, I want choosing Cotton again, after Cotton now names HSN 520911, to copy 520911 and refill the percents, so that a fresh choice takes the product's current tax code.
62. As an operator, I want choosing Cotton again, after the same Masters row's code changed from 520910 to 520912, to copy 520912, so that a fresh choice takes the current digits even though the product still names that same row.
63. As an operator, I want choosing a different product to copy that product's name, current tax code, and wholesale price, so that a different product is a new choice.
64. As an operator, I want an old line whose product still has no tax code to remain on the Bill, so that I can correct the date without first editing every product.
65. As an operator, I want that line's disabled HSN/SAC to show the code copied on the line, so that the missing product tax code does not wipe the Bill.
66. As an operator, I want saving that line without choosing the product again to keep the copied code, so that the old Bill still stands.
67. As an operator, I want choosing a different product that has no tax code to be rejected, so that the exception is only for a line already saved.
68. As an operator, I want the current product on an old line to stay available in the product control even when it has no tax code, so that I can leave it selected and save.
69. As an operator, I want a product that has a tax code, and that I am not already using on this line, to be the only other product I can choose, so that a new choice still requires an HSN/SAC.
70. As an operator, I want leaving the product unchanged to keep the copied product name after a rename, so that the name rule I already have stays.
71. As an operator, I want the bank block on the Bill to stay as it was, so that this work does not refresh Bank details.
72. As an operator, I want the receiver copy to stay as it was when I do not change the receiver, so that this work does not refresh the client.
73. As an operator, I want a Bill's collection not to change, so that a Bill does not move because a product gained a tax code.
74. As a developer, I want the glossary to record Product as an item in one collection whose category is Product or Labour, so that Product is not used to mean the Bill line.
75. As a developer, I want the glossary to say category Product names one HSN and Labour names one SAC, and that the product does not keep rates, so that a later reader does not store CGST on the product.
76. As a developer, I want the glossary to stop avoiding a tax code on a product, so that the old wording does not contradict this link.
77. As a developer, I want the glossary to say a Bill line's tax code is the product's tax code as copied when that product was chosen, so that a later read does not join the live product or the live tax code.
78. As a developer, I want one decision that the product names the tax code and the Bill line copies it, so that a later reader does not put a free HSN/SAC select back on the Bill.

## Implementation Decisions

- One product module is the only place that decides the tax code on a product and the copy when Include all products is used on a new collection. Create and update of a product go through it. It does not write Bills, tax codes, stock, or Orders. The screen calls it. Soft delete of a product does not go through it and does not clear a tax code.
- A product stores the tax code id only. It does not store the type, the code, the description, or the three rates. A read joins the Masters row, so the product shows that row's current type, code, and description. A product with no tax code reads back with those empty.
- Create requires a tax code. Update requires a tax code and may change which row the product names. Clearing the tax code is rejected. An unknown id is rejected. Category Product accepts only HSN. Labour accepts only SAC. The rejection names the rule: HSN/SAC is required, the tax code is not known, a product must use an HSN, or labour must use a SAC.
- The product form gains one required select, labeled HSN/SAC, after the prices and beside the category. Options are the tax codes of the matching type, each labeled with type, code, and description. Switching category clears a selection of the other type. There are no percent fields. Name, prices, category, and stock stay as they are.
- The products table gains one column for the type and code. A product with no tax code shows a blank cell. Search stays by product name. The product report is unchanged.
- The Bill screen no longer offers a tax code select the operator can change. Choosing a product sets the line's tax code to that product's tax code, fills the rate from the wholesale price, fills CGST and SGST from the tax code's current defaults, and sets IGST to 0. The HSN/SAC control is disabled and shows the type and code. The catalog description stays hidden. The operator can still change the three percents. Choosing the product again, including the same product, does that fill again.
- The Bill's product list offers products in this collection that have a tax code. On edit, the line's current product stays in the list even when it has no tax code, labeled with the name copied on the line, so the line can be saved without choosing another product.
- A new line, and a line whose product was changed, must submit the product's current tax code id. The product must have one. The line copies that tax code's current code and description. The percents are the ones submitted. A product with no tax code is rejected with that reason. A different tax code id is rejected.
- On edit, a line whose product id is unchanged and whose product was not chosen again keeps the stored tax code id, code, and description, even if the product now names another tax code, the Masters digits or description changed, or the product still has no tax code. The percents are the ones submitted. A submitted tax code id other than the stored one is rejected in that case. Choosing the product again, including the same product, is a new choice: the submitted tax code id must be the product's current one, and the code and description are copied from Masters now. That is how a fresh choice picks up 520912 when the same row's digits changed, while an untouched line still keeps 520910.
- The within-state pair or IGST-only rule on a line is unchanged. The catalog rule that IGST equals CGST plus SGST stays on the tax code. The bank block, the receiver copy, the bill number, the discount, and the collection are unchanged.
- Existing Bills whose tax code was chosen independently of the product stay valid. Their lines keep that copy until the product is chosen again.
- The glossary adds Product, changes the Tax code avoid line so it no longer forbids a tax code on a product, and adjusts Bill line so the copied tax code is the product's, taken when that product was chosen. Avoid rates on the product, a separate tax code choice on the Bill, and a live lookup on a saved line.
- One decision is recorded. The product names the tax code, and the Bill line copies it when the product is chosen. The rejected alternatives were an HSN/SAC the operator can still change on the Bill, an optional tax code, any tax code on any category, rates copied onto the product, digits frozen on the product, and HSN/SAC on Orders.

## Testing Decisions

- A good test asserts the outcome an operator would notice: a product was saved with an HSN or a SAC, a save was rejected, a Bill copied the product's tax code, or an edit left an old line's copy alone. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There are two seams. The product module is the only seam for the tax code on the product. Tests call create, update, and list with an in-memory stand-in for products and tax codes. The bill module is the only seam for the copy on the line. Tests call create and update with the in-memory stand-in already used for Bills. They do not open a database, boot HTTP, or render the screen.
- The product suite covers a Product saved with an HSN, Labour saved with a SAC, rejection of a missing tax code, rejection of an unknown tax code, rejection of a SAC on a Product, rejection of an HSN on Labour, an update that changes the tax code, rejection of clearing it, a list that shows the type and code, a blank type and code when the product has none, and a read that shows the code and description currently on the Masters row after that row's code is edited.
- The bill suite keeps the outcomes it already has, with the product on the line naming the tax code that line uses. It adds a create that copies the product's code and description rather than a different submitted tax code, a rejected mismatch, a rejected product with no tax code, submitted percents that differ from the tax code's defaults, an edit that keeps the copied code and description after the product is pointed at another tax code, an edit that keeps them after the Masters code and description change, an edit that copies the new code when the product is chosen again, an edit that copies the new digits when the same row's code changed and the product was chosen again, and an old line whose product has no tax code that still saves its copied code when the product is not chosen again.
- No new frontend test suite. The existing frontend tests are component tests for WhatsApp order actions and are the wrong seam for these rules. There is no HTTP or live-database harness to extend.
- Prior art is the server node:test layout used for tax-code maintenance, the shop bank account, and Bills, and the in-memory stand-in used there.

## Out of Scope

- A Bill PDF, a print preview, or any change to the Order PDF.
- WhatsApp send, resend, or a delivery status on a Bill.
- Showing HSN/SAC on an Order, or copying it onto an Order line.
- The product report.
- Search by HSN/SAC.
- Collection copy rules beyond naming the tax code on the copy. See the Copy HSN/SAC into a new collection PRD.
- Soft delete and restore of a product.
- Moving stock, or changing a product's name, prices, or category rules beyond the tax-code check.
- Storing CGST, SGST, or IGST on the product.
- Deleting a tax code, changing its type, or changing the rate rule on Masters.
- Choosing within-state or outside-state from the client's state.
- A third test seam for HTTP, the product screen, or the Bill screen.

## Further Notes

- The Masters and tax codes work said products stay without a tax code. This PRD replaces that. Tax code maintenance itself is unchanged.
- Bills already saved may name a tax code the product does not. That copy remains until the product is chosen again on that line.
- The glossary and the decision record are part of this work, not a precondition already on disk.
- This PRD is published under the repo's `docs/prd/` convention. The repo has no issue-tracker setup under `docs/agents/`. `Status: ready-for-agent` is recorded on this document the same way the Bill PRD records that role.
