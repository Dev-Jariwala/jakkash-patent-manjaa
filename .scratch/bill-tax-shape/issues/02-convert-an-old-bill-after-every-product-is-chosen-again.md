Status: ready-for-agent

## Parent

[Bill tax shape PRD](../PRD.md)

## What to build

An operator opens a Bill saved the old way. It has no tax shape. Each line still shows the charged percents it stored, such as 2.5, 2.5, and 0. Nothing is deleted and the missing rate is not invented. The switch is shown on the shared shape and stays off until every product has been chosen again.

Changing the quantity or the rate keeps those charged percents. An old exempt line of 0, 0, and 0 is not a copy. Choosing one product again stores today's trio on that line, charges it in the shape the Bill already shared, and leaves the switch off. Choosing the last remaining product again sets the tax shape to that shared shape and turns the switch on. The unlocked switch starts on the old shape. It does not flip the Bill in the same step.

An old interstate line of 0, 0, and 5, when the product is chosen again, copies today's trio and keeps charging IGST. It is not reset to within-state. A later edit remembers which lines are copies. A line added on this Bill counts as a copy immediately. Removing the last line that is not a copy unlocks the switch once every line that remains is a copy.

An old Bill whose every line is exempt shares within-state once every product has been chosen again. Switching it to interstate keeps the tax at 0. A tax shape sent while any line is still a charged-percent line is rejected. The conversion save rejects a tax shape other than the one the lines already share.

A Bill that charges both shapes is the next slice. This slice does not give that Bill a switch. Orders are unchanged. Tests call the bill module with the in-memory stand-in.

## Acceptance criteria

- [ ] An old Bill opens with its charged percents and no tax shape, and a within-state line of 2.5, 2.5, and 0 does not gain an invented IGST
- [ ] The switch stays off, on the shared shape, while any line has not been chosen again
- [ ] Changing the quantity or the rate keeps the charged percents
- [ ] An old exempt line of 0, 0, and 0 does not count as a copy
- [ ] Choosing one product again stores today's trio on that line, keeps charging the shared shape, and leaves the switch off
- [ ] Choosing the last remaining product again sets the tax shape to the shared shape and turns the switch on, still sitting on that shape
- [ ] A tax shape sent before every line is a copy is rejected
- [ ] The conversion save rejects a tax shape other than the shared one
- [ ] Choosing the product again on an old interstate line of 0, 0, and 5 keeps charging IGST and does not reset the line to within-state
- [ ] A later edit remembers which lines are copies, so those products do not have to be chosen again
- [ ] A line added on the old Bill counts as a copy immediately, and removing the last unconverted line unlocks the switch when every remaining line is a copy
- [ ] An old Bill whose every line is exempt unlocks on within-state, and switching it to interstate charges 0
- [ ] Tests on the bill module cover an untouched old line, a single re-choice that does not unlock, the unlock on the shared shape, the interstate line that stays interstate, the exempt line that is not yet a copy, and a rejected early tax shape
- [ ] A mixed Bill is not given a tax shape in this slice

## Blocked by

- [01 — Raise a new Bill on one tax shape](01-raise-a-new-bill-on-one-tax-shape.md)
