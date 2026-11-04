Status: ready-for-agent

## Parent

[Bill series, bill year, and bill serial PRD](../PRD.md)

## What to build

A saved bill number does not change. Edit shows the three stored parts, all disabled. Saving the rest of the Bill keeps that number. A different series, year, or serial sent on Edit is ignored. A Bill raised as `ST-2025-01` stays `ST-2025-01` after the collection's bill year becomes `2026`.

Changing that year does not rewrite Bills already saved. The next `ST` Bill in the collection is `ST-2026-01`. `ADI` for `2026` starts at `ADI-2026-01`. The `2025` count is left where it was, gaps included.

One decision records the bill series, the bill year, and the bill serial. It replaces only the hand-typed number and the rule that Edit may change it. Uniqueness within the collection stays. The rejected alternatives recorded there are a shop-wide count, freezing the bill year after the first Bill, and letting Edit change the series.

The glossary sentence for Bill number gains that, once saved, the number does not change.

Tests call the bill module with the in-memory stand-in. They do not render Edit.

## Acceptance criteria

- [ ] Edit shows the stored series, year, and serial, and all three are disabled
- [ ] Saving Edit keeps `ST-2025-01`, and a different series, year, or serial on the update is ignored
- [ ] Changing the collection's bill year from `2025` to `2026` leaves `ST-2025-01` stored as `ST-2025-01`
- [ ] The next `ST` Bill is `ST-2026-01`, and the first `ADI` Bill for `2026` is `ADI-2026-01`
- [ ] The `2025` count does not fill a gap that was already left
- [ ] Tests on the bill module cover the frozen number and the new year starting at `01`
- [ ] One decision records the numbering and the rejected shop-wide count, the locked year, and the editable number
- [ ] The glossary says a saved bill number does not change
- [ ] A new Bill still gets the next serial, and Orders are unchanged

## Blocked by

- [03 — Raise a bill with the next serial](03-raise-a-bill-with-the-next-serial.md)
