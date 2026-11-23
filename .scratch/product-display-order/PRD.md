Status: ready-for-agent

# Product display order PRD

## Problem Statement

On an Order, the products the shop can sell appear as rows. A product is offered when its price for that order type is above zero, and when it is active, or when it is inactive and already on the Order being edited. Those rows follow a fixed list of product names that is the same for every collection. A name on the list comes first, in that list's order. Every other product is pushed to the end. The products the shop sells most can sit in the middle, and the operator cannot move them. A rename, or a name that does not match the list exactly, drops that product out of its place. The products report uses the same list.

## Solution

Settings gains two tabs. The first keeps the WhatsApp service toggle, still one shop-wide switch. The second is Product display order for the active collection.

**Product display order** is the sequence of every product in one collection. The operator drags a row to a new place. Dropping the row saves the whole sequence. The Order form and the products report follow that sequence. Retail and wholesale share it. The Order form still skips a product it does not offer, and that product stays in the sequence, so a later price or turning the product back on puts it back in the same place.

The first sequence for a collection is the fixed name list the Order form uses today, in that same order, then every other product by name. After that, the stored sequence is the only order. A product created later goes to the end. Copying a collection keeps the source sequence for the products that are copied.

## User Stories

1. As an operator, I want Settings to show a WhatsApp tab and a Product display order tab, so that the new sequence has a place beside the switch I already use.
2. As an operator, I want the WhatsApp tab to keep the shop-wide WhatsApp service toggle, so that enabling or disabling WhatsApp order delivery works as it does today.
3. As an operator, I want that toggle to stay one setting for the whole shop, so that a collection change does not turn WhatsApp on or off.
4. As an operator, I want the Product display order tab to follow the active collection, so that I arrange the products of the collection I am working in.
5. As an operator, I want changing the active collection to show that collection's products and their sequence, so that each collection has its own order.
6. As an operator, I want a clear empty state when no collection is active, so that I know to choose a collection before dragging.
7. As an operator, I want the Product display order table to list every product in the collection, so that a product the Order form currently skips still has a place.
8. As an operator, I want an inactive product in that table, so that I can place it before I turn it back on.
9. As an operator, I want a product whose retail price or wholesale price is zero in that table, so that I can place it before I give it a price.
10. As an operator, I want each row to show the product name, retail price, wholesale price, and whether the product is active, so that I can see who the Order form will skip.
11. As an operator, I want to drag a row to a new place, so that the products we sell most can be the first rows.
12. As an operator, I want the drop to save the whole sequence immediately, so that the Order form matches the table as soon as the drop succeeds.
13. As an operator, I want no separate Save button, so that a drop is the only way the sequence changes.
14. As an operator, I want a failed drop to put the row back and tell me it failed, so that the table does not show a sequence that was not stored.
15. As an operator, I want to drag a row back after a successful drop, so that that second drop is how I undo.
16. As an operator, I want a product I create later to appear at the end of that collection's sequence, so that it does not jump into the middle.
17. As an operator, I want two products created later to sit at the end in the order I created them, so that the newer one follows the previous new one.
18. As an operator, I want renaming a product to leave its place unchanged, so that the sequence belongs to the product and not to its name.
19. As an operator, I want a collection that has never been arranged to open in today's name-list order, then every other product by name, so that the Order form does not reshuffle on the day this ships.
20. As an operator, I want products that share a name to keep their existing relative order inside that seed, so that a tie does not swap them.
21. As an operator, I want the stored sequence to be the only order after that seed, so that a new product whose name is on the old list stays at the end until I drag it.
22. As an operator, I want copying a collection to keep the source sequence for the products that are copied, so that putting a product first and then copying the collection keeps it first.
23. As an operator, I want an inactive product left out of that copy, so that collection copy still skips inactive products.
24. As an operator, I want the copied products to keep their relative order after inactive products are left out, so that the gaps do not scramble the ones that were copied.
25. As an operator, I want copied products to still start with prices and stock at zero, so that copy does not bring prices or stock along.
26. As an operator, I want a new retail Order to list the products it offers in product display order, so that the first rows are the ones I dragged to the top.
27. As an operator, I want a new wholesale Order to use that same sequence, so that I do not keep two orders for one collection.
28. As an operator, I want a product whose price for this order type is not above zero to be skipped on the Order form, so that the price rule is unchanged.
29. As an operator, I want the products on either side of a skipped product to keep their relative order, so that a hidden row does not reshuffle the ones I can sell.
30. As an operator, I want an inactive product left off a new Order, so that I cannot newly choose it.
31. As an operator, I want that inactive product to keep its place in the sequence, so that turning it back on puts it back where I dragged it.
32. As an operator, I want giving a zero-price product a price above zero to put it on the Order form in its existing place, so that I do not have to drag it again.
33. As an operator, I want editing an Order to show its rows in the current product display order, so that the form matches the sequence I use for new Orders.
34. As an operator, I want quantities already saved to stay on their product when those rows reshuffle, so that a new sequence does not clear what was sold.
35. As an operator, I want an inactive product that is already on the Order being edited to stay on the form, in its sequence place, so that I can still see that line.
36. As an operator, I want changing the sequence to leave a saved Order untouched until I save it again, so that arranging products does not rewrite history.
37. As an operator, I want a printed Order to keep the lines it was saved with, so that an old print is not rebuilt from the new sequence.
38. As an operator, I want saving an Order that is open to send its lines in the row order on the form, so that the save matches what I see.
39. As an operator, I want the products report to list every product in the collection in product display order, including a product with no sales, so that the report rows match the Settings table.
40. As an operator, I want the products list to keep its own column sorting, so that the catalog does not become the display sequence.
41. As an operator, I want the Bill product picker left as it is, so that this sequence is for Orders and the products report.
42. As an operator, I want stock-in left as it is, so that receiving stock does not follow this sequence.
43. As an operator, I want a reorder that omits a product to be rejected and the sequence left unchanged, so that a product created while the table was open is not dropped.
44. As an operator, I want a reorder that names a product from outside the collection to be rejected, so that another collection's product cannot enter this sequence.
45. As an operator, I want a reorder that repeats a product to be rejected, so that the sequence stays one place per product.
46. As an operator, I want a rejected drop to reload the table, so that I see the product that appeared while I was dragging and can try again.
47. As an operator, I want the Product display order tab to load on its own, so that it does not wait on the WhatsApp setting.
48. As an operator, I want the glossary to name Product display order, so that we do not call it a sort, a rank, or a separate retail and wholesale order.
49. As an operator, I want a decision record that one stored sequence per collection replaced the fixed name list, so that the next reader knows why retail and wholesale share it.

## Implementation Decisions

- Product display order is one sequence of every product in a collection, identified by the product, not by its name. Retail and wholesale share it. The Order form walks that sequence and skips a product whose price for that order type is not above zero, and an inactive product that is not already on the Order being edited.
- The products table gains a required display position, unique within a collection. A one-time migration seeds each collection from the fixed name list the Order form uses today, in that list's exact spelling and order, then every remaining product by name. Products that tie keep their existing relative row order. After the seed, that name list is not consulted again. The Order form and the products report stop sorting by it.
- Creating a product sets its position to one past the highest position in that collection. Creating two products appends them in creation order.
- Copying a collection reads the source products in product display order, leaves inactive products out, and writes the copied products in that relative order as the new collection's sequence. Copied prices and stock still start at zero. A copied collection is not seeded from the old name list.
- Reorder accepts the product ids of one collection in the desired order. The list must be exactly the products in that collection, each once. Any other list is rejected and the stored sequence is unchanged. A successful reorder rewrites every position in one transaction, without a unique-position collision while the write is in progress. The client saves on drop, restores the previous row order when the save fails, and reloads after a rejection so a product created during the drag is visible.
- The product returned to the client includes its display position. The products list's own sort is unchanged and does not gain this sequence as its default.
- Settings uses the existing tabs. The WhatsApp tab is the current shop-wide toggle and loads on its own. The Product display order tab reads the active collection, lists every product with name, retail price, wholesale price, and active or inactive, and drags rows with the sortable control the app already has. No active collection uses the same kind of empty state other collection screens use.
- A new Order and an Order being edited both show offered products in product display order. Quantities stay on the product. Changing the sequence does not rewrite a saved Order. Saving an open Order sends the lines in the row order on the form. A printed Order is not rebuilt from the sequence.
- The products report returns every product in the collection, including those with no sales, ordered by product display order. It does not re-sort by the old name list.
- The glossary gains Product display order: the sequence of every product in one collection, followed by the Order form and the products report. A product the Order form does not offer is skipped and stays in the sequence. Avoid sort, rank, the fixed name list, and a separate retail and wholesale order.
- A short decision record states that the shop stores one sequence per collection, seeded once from the old name list, because a live name list, two sequences, and a sequence of only the products currently on the form were rejected.

## Testing Decisions

- A good test asserts what an operator would notice: a new product lands at the end, a second new product follows it, a collection copy keeps the source sequence among the products that are copied and leaves an inactive product out, a full reorder replaces the sequence, and a reorder that omits, repeats, or adds a product leaves the sequence unchanged. It does not assert SQL text, private helpers, HTTP status lines, or React state.
- There is one seam. The product module is tested by calling create, copy, list, and reorder through the in-memory stand-in already used for products. Tests do not open a database, boot HTTP, or render a screen.
- The product suite covers a created product appended past the current end, two creates appending in order, a copy that preserves relative order when an inactive product is skipped and still starts prices and stock at zero, a reorder of the full set, and rejection of a list that is missing a product, repeats a product, or names a product outside the collection.
- The seed of existing collections is a migration. This suite does not run it. The Order form, the products report, the Settings table, and the WhatsApp tab are specified above and are not given a test seam.
- Prior art is the product suite: node:test with the in-memory product world. No new frontend suite, and no HTTP or live-database harness.

## Out of Scope

- A second sequence for retail and a second sequence for wholesale.
- A Settings table that shows only the products currently offered on one Order.
- Keeping the fixed name list as a live fallback after the seed.
- A separate Save button for the sequence.
- Changing the products list's column sorting.
- Changing the Bill product picker.
- Changing stock-in.
- Rebuilding a printed Order, or rewriting a saved Order, because the sequence changed.
- Changing who the Order form offers. Price above zero, and the inactive-product rule, stay as they are.
- Changing the WhatsApp service toggle, its shop-wide scope, or WhatsApp order delivery.
- A screen test, an HTTP test, or a database test of the seed migration.

## Further Notes

- This PRD is published in the local issue tracker. `Status: ready-for-agent` is the triage label.
- The Order form already sorts by the fixed name list, and the products report sorts by that same list after the query orders by name. This feature replaces both uses. The list is matched by name, and one entry is spelled in the list as it is spelled today, so the seed must use that spelling or today's rows will move.
- An inactive product stays listed, is left out of a collection copy, and cannot be newly chosen. This feature does not change that decision. The copy's new behavior is only that the products which are copied keep the source product display order.
- The glossary entry and the decision record are part of this work, not a precondition already on disk.
