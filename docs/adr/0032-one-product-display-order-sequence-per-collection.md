# One product display order sequence per collection

The shop stores one sequence of every product in each collection. Retail and wholesale share it. The Order form and the products report follow that sequence and skip a product the form does not offer; the product stays in the sequence so a later price or turning the product back on puts it back in the same place.

Each collection is seeded once from the fixed name list the Order form used before this shipped, in that list's exact spelling and order, then every other product by name. After the seed, that name list is not consulted again.

The rejected alternatives were keeping the name list as a live fallback, maintaining separate retail and wholesale sequences, and storing only the products currently offered on one Order. Those would reshuffle without an explicit drag, split work the operator expects to do once, or drop products from the sequence when the form skips them.