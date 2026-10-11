Status: ready-for-agent

## What to build

An operator adds or edits a product and must choose HSN/SAC. Category Product offers only HSN. Labour offers only SAC. Each option shows the type, the code, and the description, so an HSN and a SAC that share the same digits stay distinct. Switching category clears a tax code of the other type. The form has no CGST, SGST, or IGST fields. Name, prices, category, and stock stay as they are.

A save with no tax code is rejected and told that HSN/SAC is required. An unknown tax code is rejected. A Product saved with a SAC, or Labour saved with an HSN, is rejected, and the message says a product must use an HSN or labour must use a SAC. The product stores only the tax code id. It shows the type, code, and description currently on that Masters row, so editing the code or description on Masters shows on the product. Two products may name the same tax code. Clearing the tax code on edit is rejected. A product already saved may have no tax code until the next edit, and that next edit requires one.

The products table shows the type and code, and a blank cell when the product has none. Search stays by product name. One product module is the only place that decides this. Create and update go through it. Tests call that module with an in-memory stand-in for products and tax codes. Soft delete does not clear a tax code. Copying products into a new collection is unchanged and can still create a product with no tax code. Orders do not show or copy HSN/SAC, and an Order can still use a product that has none. Tax code maintenance is unchanged: no delete, and the type stays fixed.

The glossary records Product as an item in one collection whose category is Product or Labour, naming one HSN or one SAC and keeping no rates. The Tax code entry no longer avoids a tax code on a product. This slice does not change the Bill.

## Acceptance criteria

- [ ] The product form has a required HSN/SAC select and no CGST, SGST, or IGST fields
- [ ] Category Product lists only HSN, Labour lists only SAC, and each option shows type, code, and description
- [ ] Switching category clears a tax code of the other type
- [ ] A missing tax code is rejected and the message says HSN/SAC is required
- [ ] An unknown tax code is rejected
- [ ] A SAC on a Product, or an HSN on Labour, is rejected, and the message says a product must use an HSN or labour must use a SAC
- [ ] Create and edit save the tax code id only, and a later read shows the type, code, and description currently on that Masters row after the code or description is edited
- [ ] Edit can change which tax code the product names, cannot clear it, and two products may name the same tax code
- [ ] A product that already exists may have no tax code until it is edited, and that edit requires one
- [ ] The products table shows the type and code, and a blank cell when there is none
- [ ] Name, prices, category, stock, search by product name, soft delete, collection copy, Orders, and tax code maintenance stay as they are
- [ ] Tests on the product module, using an in-memory stand-in, cover a Product with an HSN, Labour with a SAC, the missing, unknown, and wrong-type rejections, an update that changes the tax code, a list that shows type and code or a blank, and a read that follows an edited Masters code
- [ ] The glossary records Product, and the Tax code avoid line no longer forbids a tax code on a product

## Blocked by

None - can start immediately
