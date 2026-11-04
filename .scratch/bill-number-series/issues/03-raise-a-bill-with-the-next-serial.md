Status: ready-for-agent

## Parent

[Bill series, bill year, and bill serial PRD](../PRD.md)

## What to build

A new Bill no longer asks for three typed parts. The operator picks a bill series that is active. The year box shows the open collection's bill year and is disabled. The serial box shows the next serial and is disabled. Save stores one hyphenated number.

The first `ST` Bill in a collection whose year is `2025` is `ST-2025-01`. The next is `ST-2025-02`. The first `ADI` Bill for that year is `ADI-2025-01`. `ST-2025-01` and `ST-2025-03`, with no `02`, make the next `ST` Bill `ST-2025-04`. `09` is followed by `10`, and `99` by `100`. A stored `8` and `08` both count as 8, so the next is `09`. A third part that is not digits, such as `A`, does not count. The saved number is still one this collection does not already have. Adding `00` when `00-2025-01` and `00-2025-03` already exist makes the next `00` Bill for `2025` be `00-2025-04`.

The number on the saved Bill is the one assigned at save. A second save that was shown `04` becomes `05` when another Bill took `04` first. A year or a serial sent with the new Bill is ignored.

A collection with no bill year is refused with "Set a bill year on this collection before raising a bill." No active series is refused with "Add a bill series on Masters before raising a bill." A series that is inactive or unknown is refused with "This bill series is inactive."

`ST-2026-01` may be saved again in another collection. A second `ST-2025-01` in the same collection is still refused with "This bill number is already in use." The list and the printed Bill show the stored number. Bills already saved keep the numbers they have.

Edit may still change a bill number. Freezing it, and starting a new count when the collection's bill year changes, is the next slice.

The glossary adds Bill serial: the generated third part, counted inside one collection for one bill series and one bill year. Avoid a shop-wide sequence, and a typed number. Bill number is redefined for a new Bill: the series is chosen, the year is the collection's current bill year, and the serial is generated, stored as one hyphenated value, unique within the collection. Avoid invoice number, order number, and typing the year or the serial.

Tests call the bill module with the in-memory stand-in. They do not render the Bill form.

## Acceptance criteria

- [ ] A new Bill offers only bill series that are active, and the year and the serial are disabled
- [ ] The first `ST` Bill for year `2025` is `ST-2025-01`, the next is `ST-2025-02`, and the first `ADI` Bill is `ADI-2025-01`
- [ ] A gap at `02` makes the next `ST` Bill `ST-2025-04`
- [ ] `09` is followed by `10`, and `99` by `100`
- [ ] A stored `8` and `08` make the next serial `09`, and a third part that is not digits does not count
- [ ] Existing `00-2025-01` and `00-2025-03` make the next `00` Bill `00-2025-04` once `00` is a bill series
- [ ] A year or a serial sent on create is ignored, and a serial taken by another save is not reused
- [ ] A missing bill year is refused with "Set a bill year on this collection before raising a bill."
- [ ] No active series is refused with "Add a bill series on Masters before raising a bill."
- [ ] An inactive or unknown series is refused with "This bill series is inactive."
- [ ] `ST-2026-01` can be saved in a second collection, and a second copy in the same collection is refused with "This bill number is already in use."
- [ ] The list and the printed Bill show the stored number, and Bills already saved keep their numbers
- [ ] Tests on the bill module cover the count, the gap, the other collection, and the refusals
- [ ] The glossary records Bill serial and redefines Bill number for a new Bill
- [ ] Edit may still change a number, and Orders are unchanged

## Blocked by

- [01 — Add a bill series on Masters](01-add-a-bill-series-on-masters.md)
- [02 — Set a bill year on a collection](02-set-a-bill-year-on-a-collection.md)
