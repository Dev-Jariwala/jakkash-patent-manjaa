Status: ready-for-agent

## What to build

A Bill number may be used once in each collection. An operator saves 00-26-01 in the collection that is open, switches collection, and saves 00-26-01 again. Both Bills keep that number. A second 00-26-01 in the same collection is rejected, and the message stays "This bill number is already in use." The other collection's Bill plays no part in that rejection.

Edit may save the Bill's own current number. Edit may change a Bill to a number that exists only in another collection. Edit rejects a number that another Bill in the same collection already has, with the same message.

The number stays three trimmed parts, each required, at most 20 characters, and free of hyphens, stored as one hyphenated value. 00-26-01 and 0-26-1 stay different numbers. A Bill stays in the collection where it was raised. The list for a collection shows that collection's Bill, not the other collection's Bill with the same number. The print shows the number of the Bill that was opened. No Bills are deleted.

An Order's number is unchanged, including the same number in another collection and the retail and wholesale split inside one collection. Raising a Bill still does not change an Order. One bill module remains the only writer. Tests call create and update with an in-memory stand-in.

The glossary says a Bill number is unique within the collection it was raised in. One decision records that and supersedes the shop-wide bill number decision. The rejected alternative is keeping the number unique across the shop.

## Acceptance criteria

- [ ] 00-26-01 saves in one collection and again in another, and both Bills keep that number
- [ ] A second 00-26-01 in the same collection is rejected with "This bill number is already in use"
- [ ] The other collection's 00-26-01 does not cause that rejection
- [ ] Edit saves the Bill's own current number
- [ ] Edit takes a number that exists only in another collection
- [ ] Edit rejects a number that another Bill in the same collection already has, with "This bill number is already in use"
- [ ] The number stays three trimmed parts, stored as one hyphenated value, and 00-26-01 stays different from 0-26-1
- [ ] A missing part, a hyphen inside a part, and a part longer than 20 characters are still rejected
- [ ] The list for a collection shows that collection's Bill, and the print shows the number of the Bill that was opened
- [ ] No Bills are deleted, and a Bill cannot move to another collection
- [ ] Orders are unchanged, including uniqueness by collection and retail or wholesale type
- [ ] Tests on the bill module, using an in-memory stand-in, cover the two-collection save, the same-collection rejection, an edit that keeps its own number, and an edit that takes a number used only in another collection
- [ ] The glossary says a Bill number is unique within its collection, and one decision supersedes the shop-wide bill number decision

## Blocked by

None - can start immediately
