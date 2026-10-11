Status: ready-for-agent

## What to build

An operator raises a new Bill. Choosing a product fills HSN/SAC from that product and the field stays disabled. The disabled field shows the type and code. The catalog description stays hidden. The rate still fills from the wholesale price, and the operator can still change it. CGST and SGST fill from that tax code's current defaults, IGST starts at 0, and the operator can still change the three percents. Choosing the product again fills the rate, the tax code, and those percents again.

The product list offers only products in this collection that already have an HSN/SAC. A kept line must submit that product's current tax code. The saved line copies that tax code's current code and description. The percents saved are the ones submitted, including a within-state pair, an exempt line, or an IGST-only line. A product with no HSN/SAC is rejected, and the message says so. A different tax code is rejected. A product from another collection is still rejected. The same product may be on two lines. The existing percent shapes, discount, bank block, and receiver copy are unchanged.

This slice is a new Bill only. Opening a saved Bill and the rules for leaving its copy alone are the next slice. One bill module remains the only writer of the line. Tests call that module with the in-memory stand-in. Existing bill outcomes still hold once the product on the line names the tax code that line uses. Orders are unchanged.

## Acceptance criteria

- [ ] On a new Bill, choosing a product fills HSN/SAC, disables that field, and shows the type and code without the catalog description
- [ ] Choosing a product still fills the wholesale price, fills CGST and SGST from the tax code's current defaults, sets IGST to 0, and leaves the three percents editable
- [ ] Choosing the product again fills the rate, the tax code, and the percents again
- [ ] The product list offers only products in this collection that have an HSN/SAC
- [ ] Final Save copies that product's current code and description, and stores the percents the operator submitted, including a within-state pair, an exempt line, and an IGST-only line
- [ ] A product with no HSN/SAC is rejected and the message says the product has no HSN/SAC
- [ ] A tax code other than the product's is rejected
- [ ] A product from another collection is rejected, and the same product may be on two lines
- [ ] Charging both percent shapes, or unequal CGST and SGST, is still rejected
- [ ] The bank block and the receiver copy are unchanged
- [ ] Tests on the bill module cover a create that copies the product's code and description, a rejected mismatch, a rejected product with no tax code, and submitted percents that differ from the tax code's defaults
- [ ] Edit of a saved Bill is not part of this slice

## Blocked by

- [01 — Name an HSN or SAC on a product](01-name-an-hsn-or-sac-on-a-product.md)
