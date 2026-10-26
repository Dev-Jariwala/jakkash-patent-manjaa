Status: ready-for-agent

## Parent

[Bill tax shape PRD](../PRD.md)

## What to build

An operator opens a Bill saved the old way that charges both shapes: one line has CGST and SGST, and another has IGST. That Bill has no switch. Choosing every product again still does not give it a tax shape. Each line keeps its own charged shape. An interstate line stays interstate, and a within-state line stays within-state. Those lines keep storing charged percents, not a trio.

If the operator removes the conflicting lines and chooses the remaining products again, the Bill that is left shares one shape and can convert under the rule from the previous slice. A tax shape sent while the Bill still mixes is rejected.

Orders are unchanged. Tests call the bill module with the in-memory stand-in.

## Acceptance criteria

- [ ] An old Bill with CGST and SGST on one line and IGST on another has no switch and no tax shape
- [ ] Choosing every product again on that Bill still leaves it without a tax shape
- [ ] Each re-chosen line keeps the charged shape it already had, including an interstate line that stays interstate
- [ ] Those lines keep storing charged percents, not a trio
- [ ] A tax shape sent for that Bill is rejected
- [ ] Removing the conflicting lines and choosing the remaining products again unlocks the switch on the shape that remains
- [ ] Tests on the bill module cover a mixed Bill that stays mixed after every product is chosen again, and a Bill that converts only after the conflicting line is gone

## Blocked by

- [02 — Convert an old Bill after every product is chosen again](02-convert-an-old-bill-after-every-product-is-chosen-again.md)
