Status: ready-for-agent

## What to build

An operator opens the HSN/SAC tab on Masters, after Cities, and adds a tax code. The row is HSN (goods) or SAC (services), with a statutory code, a description, and default CGST, SGST, and IGST. The code is unique within its type, so the same digits may exist once as HSN and once as SAC. A save is accepted only when CGST equals SGST and IGST equals their sum. An HSN is 4, 6, or 8 digits. A SAC is 6 digits. Edit can change the code, the description, and the rates, and cannot change the type. There is no delete. The table shows type, code, description, and the three rates. One tax-code maintenance module is the only writer, and tests call it with an in-memory stand-in. The glossary records Bill, Bill line, and Tax code. One decision record explains the three default rates and that a future Bill line copies the code, description, and rates charged. This slice does not build the Bill. Orders stay Orders, and products do not gain a tax code.

## Acceptance criteria

- [ ] Masters has an HSN/SAC tab after Cities, listing type, code, description, CGST, SGST, and IGST
- [ ] Add saves an HSN of 4, 6, or 8 digits, or a SAC of 6 digits, with a description and three rates, and the row keeps a stable id
- [ ] Any other length, a non-digit code, or a blank description is rejected
- [ ] A second code of the same type is rejected with a clear message; the same digits may be saved once as HSN and once as SAC
- [ ] A save is rejected unless CGST equals SGST and IGST equals their sum; zero rates save; a negative rate or more than two decimal places is rejected; a missing rate is rejected
- [ ] Edit shows the current type, code, description, and rates, and can change the code, description, and rates when the rules still hold
- [ ] Saving the row's own code again succeeds; changing the code onto another row of the same type fails; changing the type fails
- [ ] There is no delete
- [ ] Tests on the tax-code maintenance module, using an in-memory stand-in, cover create, list, the code and rate rejections, both types sharing digits, edit, a repeated save of the row's own code, and a rejected type change
- [ ] The glossary records Bill as the future GST document, not as a name for an Order; a Bill line as a future line that stores the tax code id and a copy of the code, description, and rates charged; and Tax code in the terms above
- [ ] An ADR records why the three default rates are stored under the equality rule, the rejected single-rate and auto-fill alternatives, and that a future Bill line copies the code, description, and charged rates
- [ ] No Bill screen is added, Orders stay Orders, and products do not gain a tax code

## Blocked by

- [01 — See countries, states, and cities on Masters](01-see-countries-states-and-cities-on-masters.md)
