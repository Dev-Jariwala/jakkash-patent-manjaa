# Bill number unique within collection

Status: accepted

Supersedes [0018-manual-shop-wide-bill-number.md](./0018-manual-shop-wide-bill-number.md).

The bill number is three parts typed by hand, trimmed, stored as one hyphenated value, and unique within the collection the Bill was raised in. Edit may change the number when it is free in that collection; saving the bill's own current number is not treated as a duplicate. A number used only on a Bill in another collection is allowed on create and edit.

The rejected alternative was keeping the number unique across the shop, which blocked reusing the same series in each collection.
