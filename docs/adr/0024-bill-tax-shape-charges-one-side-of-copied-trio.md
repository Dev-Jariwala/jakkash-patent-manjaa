# Bill tax shape charges one side of the copied trio

A new Bill stores one tax shape, within-state or interstate. Each line stores a copied trio of CGST, SGST, and IGST from the tax code when that product was chosen. The shape charges the within-state pair or the copied IGST; the line keeps the full trio so a later switch or edit uses the copy and does not read Masters again.

A Bill saved before tax shape has no tax shape. Its lines keep the percents that were charged until a later slice converts them when every product has been chosen again and the lines share one shape.

The rejected alternatives were typed percents on a new Bill, a three-way switch, a shape per line, reading the live tax code on a switch, wiping Bills or inventing a missing rate, converting on the next save without re-choice, and giving a mixed old Bill a switch.

This decision supersedes the either-or charged-percents rule on the Bill line in [0017](./0017-bill-copies-receiver-and-line-with-either-or-tax-percents.md) for Bills that have a tax shape. The receiver copy in that decision stays. [0014](./0014-tax-code-default-rates-and-bill-line-snapshot.md) still records default rates on the tax code; a new Bill line copies the trio and the shape picks the side that is charged.
