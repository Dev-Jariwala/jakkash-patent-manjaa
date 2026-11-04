Status: ready-for-agent

## Parent

[Bill series, bill year, and bill serial PRD](../PRD.md)

## What to build

Export's first box becomes the bill series list. Every series on Masters is listed, including one that is inactive. A name that was only ever typed on an old Bill, such as `00`, is absent until someone adds `00` on Masters. After `00` is added and made inactive, Export can still pick it, and a new Bill still cannot.

The year, From, and To stay typed, so `2025` can be exported after the collection's bill year is `2026`. A span of `ST` and `2025` from `1` to `10` is unchanged: the third part is an integer, `08` and `8` are the same number, a gap is skipped, and `st` stays out of `ST`. A Bill in another collection stays out. Date export is unchanged. The bill-number read still takes the series as stored text. The screen is what limits the first box to the Masters list.

Tests call the bill module's Export with the in-memory stand-in. They do not render the PDF.

## Acceptance criteria

- [ ] Export's first box lists every bill series, including one that is inactive
- [ ] `00` is missing from that list until `00` is added on Masters
- [ ] An inactive `00` can be chosen on Export and cannot be chosen on a new Bill
- [ ] The year, From, and To stay typed
- [ ] `ST` and `2025` from `1` to `10` still returns the stored Bills in integer order, with a gap skipped and `st` left out
- [ ] The same number in another collection is left out
- [ ] A bill-date Export is unchanged
- [ ] Tests on the bill module cover the span, the inactive series, and the other collection
- [ ] Orders are unchanged

## Blocked by

- [01 — Add a bill series on Masters](01-add-a-bill-series-on-masters.md)
