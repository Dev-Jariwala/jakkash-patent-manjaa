Status: ready-for-agent

## Parent

[Product display order PRD](../PRD.md)

## What to build

Settings shows two tabs. The WhatsApp tab keeps the shop-wide WhatsApp service toggle, and a collection change does not turn it on or off. The Product display order tab follows the active collection. Changing the collection shows that collection's products and their sequence. When no collection is active, the tab tells the operator to choose one. The Product display order tab loads on its own and does not wait on the WhatsApp setting.

The table lists every product in the collection, including an inactive product and a product whose retail price or wholesale price is zero. Each row shows the product name, retail price, wholesale price, and whether the product is active. The operator drags a row to a new place. The drop saves the whole sequence immediately. There is no separate Save button. A failed drop puts the row back and tells the operator it failed. Dragging the row back is the undo.

The saved list must be exactly the products in that collection, each once. A list that omits a product, repeats a product, or names a product from outside the collection is rejected, and the stored sequence is left unchanged. A rejected drop reloads the table so a product created while it was open is visible.

After a successful drop, the Order form and the products report follow the new sequence. The products list, the Bill product picker, stock-in, and WhatsApp order delivery stay as they are.

A short decision record states that the shop stores one sequence per collection, seeded once from the old name list, because a live name list, two sequences, and a sequence of only the products currently on the form were rejected.

Tests call reorder through the existing in-memory product world. They cover a reorder of the full set, and rejection of a list that is missing a product, repeats a product, or names a product outside the collection. They do not render Settings.

## Acceptance criteria

- [ ] Settings has a WhatsApp tab and a Product display order tab
- [ ] The WhatsApp tab is still the one shop-wide toggle, and a collection change does not change it
- [ ] The Product display order tab follows the active collection and asks for a collection when none is active
- [ ] The table lists every product, including inactive products and products with a zero price, and shows name, retail price, wholesale price, and active or inactive
- [ ] Dropping a row saves the whole sequence, with no separate Save button
- [ ] A failed drop restores the previous row order and tells the operator it failed
- [ ] A reorder that omits a product, repeats a product, or names a product outside the collection is rejected, the sequence is unchanged, and the table reloads
- [ ] After a successful drop, the Order form and the products report show the new sequence
- [ ] The Product display order tab does not wait on the WhatsApp setting
- [ ] Tests on the product module cover a full reorder and the three rejections
- [ ] The decision record explains the one sequence per collection
- [ ] The products list, the Bill product picker, stock-in, and WhatsApp order delivery stay as they are

## Blocked by

- [01 — Store product display order and follow it](01-store-product-display-order-and-follow-it.md)
