# Bill series, bill year, and bill serial

Status: accepted

A new Bill takes its number from a bill series chosen on the Bill, the collection's bill year at the time the Bill is raised, and the next bill serial for that series and year in that collection. The stored bill number is one hyphenated value. Once saved, it does not change. Edit shows the three stored parts and ignores a different series, year, or serial. Changing the collection's bill year does not rewrite Bills already saved. The next Bill for a series uses the new year and starts at 01. A gap already left in the old year stays empty.

This replaces the hand-typed number and the rule that Edit may change it in [0022-bill-number-unique-within-collection.md](./0022-bill-number-unique-within-collection.md). Uniqueness within the collection stays. The same number may exist on a Bill in another collection. A second copy in the same collection is still rejected.

The rejected alternatives were a shop-wide count for one series and year, freezing the bill year after the first Bill, and letting Edit change the series.
