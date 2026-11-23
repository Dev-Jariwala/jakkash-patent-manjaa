Status: ready-for-agent

## Parent

[Product display order PRD](../PRD.md)

## What to build

Every product in a collection has a place in that collection's product display order. The place belongs to the product, not to its name. Retail and wholesale share the one sequence.

A collection that already exists is seeded once from the fixed name list the Order form uses today, in that list's exact spelling and order, then every other product by name. Products that tie keep their existing relative order. After the seed, that name list is not consulted again.

A product created later is appended at the end. Two products created later sit at the end in the order they were created. Renaming a product leaves its place unchanged.

Copying a collection keeps the source sequence for the products that are copied. An inactive product stays out of the copy, and the products that are copied keep their relative order. Copied prices and stock still start at zero. The new collection is not seeded from the old name list.

A new Order and an Order being edited list the products they offer in product display order. A product whose price for that order type is not above zero is skipped. An inactive product is skipped on a new Order, and stays on an Order being edited when it is already on that Order. Products on either side of a skipped product keep their relative order. Giving a product a price above zero, or turning it back on, puts it on the form in its existing place. Quantities already saved stay on the product. Changing the sequence does not rewrite a saved Order. A printed Order keeps the lines it was saved with. Saving an Order that is open sends its lines in the row order on the form.

The products report lists every product in the collection in product display order, including a product with no sales.

The products list keeps its own column sorting. The Bill product picker and stock-in stay as they are.

The glossary adds Product display order: the sequence of every product in one collection, followed by the Order form and the products report. A product the Order form does not offer is skipped and stays in the sequence. Avoid sort, rank, the fixed name list, and a separate retail and wholesale order.

Tests call create, copy, and list through the existing in-memory product world. They cover a created product appended past the current end, two creates appending in order, and a copy that preserves relative order when an inactive product is skipped and still starts prices and stock at zero. They do not run the seed migration, boot HTTP, or render a screen.

## Acceptance criteria

- [ ] Each product has one place in its collection's product display order, unique within that collection
- [ ] An existing collection opens in today's name-list order, then every other product by name, with ties keeping their existing relative order
- [ ] After that seed, the name list is not used to place a product, including a later product whose name is on the list
- [ ] A new product is appended, and a second new product follows it
- [ ] Renaming a product leaves its place unchanged
- [ ] Copying a collection keeps the source sequence for the products that are copied, leaves inactive products out, and starts copied prices and stock at zero
- [ ] A new retail Order and a new wholesale Order list offered products in that same sequence
- [ ] A product whose price for that order type is not above zero is skipped, and the products beside it keep their relative order
- [ ] An inactive product is left off a new Order, stays on an Order being edited when it is already on that Order, and keeps its place for when it is offered again
- [ ] Quantities stay on the product when rows reshuffle, a saved Order is not rewritten by the sequence change, and a printed Order keeps the lines it was saved with
- [ ] Saving an open Order sends its lines in the row order on the form
- [ ] The products report lists every product in the collection, including one with no sales, in product display order
- [ ] The products list, the Bill product picker, and stock-in keep their current ordering
- [ ] Tests on the product module cover append-on-create, two creates, and copy order with an inactive product left out
- [ ] The glossary records Product display order

## Blocked by

None - can start immediately
