Status: ready-for-agent

## What to build

The products list is ordered by serial number, lowest first. An edit does not change the serial number, so the row stays in that order. The list remembers the page and the page size for the collection that is open. Saving a product and returning to the list uses that page, so P-46 is still the row in front of the operator. Another collection has its own page. The total count stays the same after an edit, because setting a tax code does not add or remove a product. Search by product name stays as it is.

The product module is the only place that decides the list order. Remembering the page is part of this slice and is not a second test seam.

## Acceptance criteria

- [ ] The products list is ordered by serial number, lowest first
- [ ] Setting an HSN/SAC does not change the serial number, and the row stays in that order
- [ ] Saving the product and returning to the list shows the same page, so P-46 is still visible
- [ ] The page size the operator chose is still the page size
- [ ] The remembered page belongs to the collection that is open
- [ ] The total count is unchanged after the edit
- [ ] Search by product name stays as it is
- [ ] Tests on the product module, using an in-memory stand-in, cover a list ordered by serial number that stays in that order after a tax code is set

## Blocked by

None - can start immediately
