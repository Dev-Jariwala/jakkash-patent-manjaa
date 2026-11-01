Status: ready-for-agent

## Parent

[Optional tax code and inactive product PRD](../PRD.md)

## What to build

A new product starts active. The operator can mark it inactive on create or on edit, and can mark it active again. The products list shows Active or Inactive on every row, including inactive ones, and has no delete control for this. The unused delete flag stays unused. Labour and a Product follow the same rule. Every product already saved starts active, so today's catalogue does not disappear.

An inactive product cannot be newly chosen. The product module owns that choice rule. An Order's rows are the active products whose price for that sale is above zero. On edit, a product already on the Order remains even when it is now inactive, and its quantity, the line's price, and the Order's date can still be saved. The usual stock check still applies. An inactive product that is not already on the Order has no row. Removing it keeps it off until it is active again. A new Order that names an inactive product is rejected with the message that the product is inactive, even if the screen is bypassed. Saving an Order that already names it succeeds.

A Bill offers only active products that have a tax code. An inactive product stays off a new Bill even when it has a tax code. A new line whose product is inactive is rejected as inactive, including when it also has no tax code, so the operator is not told about the missing code first. A line that already names an inactive product stays in that line's product control and can be saved, including a quantity change. The Bill's stock check still applies. Leaving that product and trying to choose it again is impossible until it is active. An active product with no tax code stays off the Bill, and a new line for it is still rejected because it has no HSN/SAC.

Stock-in offers only active products. A new stock entry for an inactive product is rejected with the message that the product is inactive. An existing stock entry keeps its product, the control stays locked, and the quantity and date can still change. Turning a product inactive does not change stock in hand.

Purchases stay a supplier record with no product. The product report stays as it is. The glossary adds Inactive product as a product the operator has turned off, still listed, and not available for a new choice. Avoid deleted and the unused delete flag. Collection copy is the next slice, so this slice does not change which products a new collection receives.

## Acceptance criteria

- [ ] A new product is active when the choice is omitted, and existing products become active
- [ ] The product form can set Active or Inactive on create and on edit, and can turn an inactive product active again
- [ ] The products list shows Active or Inactive and still includes inactive rows
- [ ] There is no delete control for this, and the unused delete flag is not read or written
- [ ] Labour and a Product follow the same active rule
- [ ] A new Order omits an inactive product, and an edit keeps a product already on that Order
- [ ] That existing Order line can change quantity and price, and the Order's date can change, while the stock check still applies
- [ ] Removing the inactive product keeps it off the Order until it is active again
- [ ] A new Order that names an inactive product is rejected with the message that the product is inactive
- [ ] An Order update that already names that product succeeds
- [ ] A Bill offers only active products that have a tax code
- [ ] A new Bill line for an inactive product is rejected as inactive, including when the product also has no tax code
- [ ] An active product with no tax code is still rejected on a new Bill line because it has no HSN/SAC
- [ ] A Bill line that already names an inactive product stays selectable and can be saved, and the Bill's stock check still applies
- [ ] After the operator leaves that product, it cannot be chosen again until it is active
- [ ] Stock-in offers only active products, and a new stock entry for an inactive product is rejected with the message that the product is inactive
- [ ] An existing stock entry keeps its product and can still change quantity and date
- [ ] Stock in hand is unchanged by marking a product inactive
- [ ] Purchases and the product report are unchanged
- [ ] Product tests cover a saved inactive product, a default of active, a list that includes it, and the choice rule
- [ ] Bill tests cover a rejected new inactive line, the inactive-and-no-tax-code case, and a saved line whose product is now inactive
- [ ] The glossary records Inactive product, and avoids deleted and the unused delete flag

## Blocked by

None - can start immediately
