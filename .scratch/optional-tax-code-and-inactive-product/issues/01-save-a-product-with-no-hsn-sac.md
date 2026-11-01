Status: ready-for-agent

## Parent

[Optional tax code and inactive product PRD](../PRD.md)

## What to build

An operator can save a Product with no HSN, and Labour with no SAC. The save is not told that HSN/SAC is required. An existing code can be cleared, and the product reads back with none. The HSN/SAC control can be set back to empty. When a code is chosen, a Product still names an HSN and Labour still names a SAC. A SAC on a Product, or an HSN on Labour, is rejected with the message that a product must use an HSN or labour must use a SAC. An unknown tax code is rejected. Switching category still clears a code of the other type. The form has no CGST, SGST, or IGST fields. Name, prices, category, and stock stay as they are. Two products may name the same tax code. The products list shows the type and code, and a blank cell when there is none. Search stays by product name. A product that already has no tax code stays valid.

An Order still shows an active product whose price for that sale is above zero, with or without a tax code. Retail uses the retail price and wholesale uses the wholesale price. A zero price for that sale stays off the Order. An Order does not show or store HSN/SAC.

A Bill still offers only products that have a tax code, and a new line whose product has none is still rejected with the message that the product has no HSN/SAC. A Bill that already copied a code keeps that copy after the product's tax code is cleared, as long as the product is not chosen again. Choosing that product again after the clear is rejected. Choosing it again while it still names a code copies the current code. A submitted tax code that is not the product's current one is still rejected on a new choice. Tax shape, percents, the bank block, and the receiver copy stay as they are.

The glossary says a product may name one tax code, and that Product names an HSN and Labour names a SAC only when it does. The Tax code entry says a product may name one tax code by id. One decision records that the tax code is optional, and that the Bill line copy, the category match when a code is present, no rates on the product, and no HSN/SAC on an Order still hold. Inactive products are the next slice.

## Acceptance criteria

- [ ] A Product can be saved with no HSN, and Labour can be saved with no SAC, without an "HSN/SAC is required" rejection
- [ ] An existing HSN or SAC can be cleared, and the product reads back with no tax code
- [ ] The HSN/SAC control can be set back to empty
- [ ] A Product with an HSN, and Labour with a SAC, still save
- [ ] A SAC on a Product, or an HSN on Labour, is rejected with the message that a product must use an HSN or labour must use a SAC
- [ ] An unknown tax code is rejected
- [ ] Switching category clears a tax code of the other type
- [ ] The form has no CGST, SGST, or IGST fields, and name, prices, category, and stock are unchanged
- [ ] Two products may name the same tax code
- [ ] The products list shows the type and code, and a blank cell when there is none
- [ ] A product that already has no tax code stays valid
- [ ] An Order still lists an active product with a price above zero for that sale, with or without a tax code, and still hides a zero price
- [ ] An Order does not show or store HSN/SAC
- [ ] A Bill still offers only products with a tax code, and a new line whose product has none is rejected with the message that the product has no HSN/SAC
- [ ] A saved Bill keeps its copied code after the product's tax code is cleared, until the product is chosen again
- [ ] Choosing the product again after the clear is rejected, and choosing it again while it still names a code copies the current code
- [ ] A mismatched tax code on a new choice is still rejected
- [ ] Tax shape, percents, the bank block, the receiver copy, and search by product name stay as they are
- [ ] Product tests, using the in-memory stand-in, cover a save with no tax code, a cleared code, the category match, an unknown code, and a blank list cell
- [ ] Bill tests, using the in-memory stand-in, cover a kept copy after the product's code is cleared, and a fresh choice that is rejected once the code is gone
- [ ] The glossary and the optional-tax-code decision are recorded

## Blocked by

None - can start immediately
