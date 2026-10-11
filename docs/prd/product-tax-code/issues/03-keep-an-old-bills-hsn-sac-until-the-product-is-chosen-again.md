Status: ready-for-agent

## What to build

An operator opens a saved Bill. The disabled HSN/SAC field shows the type and code copied on the line, not the tax code the product names now. The percents shown are the ones that were saved. Saving without choosing the product again keeps that tax code id, code, and description. That stays true after the product is pointed at a different tax code, after Masters changes that row's code or description, and when the product still has no tax code. The percents stored are the ones submitted on this save. A submitted tax code other than the copy already on the line is rejected when the product was not chosen again. The copied product name, the receiver copy, the bank block, and the Bill's collection stay as they are.

Choosing the product again, including the same product, is a new choice. The line must use that product's current tax code, and it copies the current code and description. Choosing Cotton again after Cotton names a different HSN copies that HSN. Choosing Cotton again after the same Masters row's digits change copies the new digits. The rate and the percents refill as they do on a new Bill, and the operator can still change the percents before save. Choosing a different product copies that product's name, current tax code, and wholesale price. A different product that has no tax code is rejected. The line's current product stays in the product control even when it has no tax code, so the line can be saved without choosing another one. Every other product in the list still has an HSN/SAC.

The glossary adjusts Bill line so the copied tax code is the product's, taken when that product was chosen. One decision records that the product names the tax code and the Bill line copies it. The rejected alternatives are an HSN/SAC the operator can still change on the Bill, an optional tax code, any tax code on any category, rates copied onto the product, digits frozen on the product, and HSN/SAC on Orders. Tests call the same bill module.

## Acceptance criteria

- [ ] Opening a saved Bill shows the copied type and code, and the percents that were saved, not the product's current tax code or the current Masters defaults
- [ ] Saving without choosing the product again keeps the copied tax code id, code, and description after the product is pointed at another tax code
- [ ] That same save keeps the copy after Masters changes the code or the description
- [ ] The percents stored on that save are the ones submitted
- [ ] A different tax code submitted without choosing the product again is rejected
- [ ] An old line whose product still has no tax code still shows and saves its copied code when the product is not chosen again
- [ ] That product stays selectable on its own line, and any other product that has no tax code is rejected
- [ ] Choosing the same product again copies the product's current code and description, including new digits on the same Masters row, and refills the rate and the percents
- [ ] Choosing a different product copies that product's name, current tax code, and wholesale price
- [ ] The copied product name, the receiver copy, the bank block, and the collection are unchanged when those choices are left alone
- [ ] Tests on the bill module cover an untouched line after the product is retargeted, an untouched line after the Masters code and description change, a fresh choice that copies the new code, a fresh choice that copies new digits on the same row, and an old line whose product has no tax code
- [ ] The glossary records that a Bill line's tax code is the product's, copied when that product was chosen
- [ ] An ADR records that the product names the tax code and the Bill line copies it, including the rejected alternatives

## Blocked by

- [02 — Fill HSN/SAC from the product on a new Bill](02-fill-hsn-sac-from-the-product-on-a-new-bill.md)
