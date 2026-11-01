# A product tax code is optional

A product may be saved with no tax code, and an existing code may be cleared, so a good or a labour sold only on an Order is not blocked by a tax code it is never billed with. This reverses the rejected alternative in [0020](./0020-product-names-tax-code-and-bill-line-copies-it.md) that required every product to name one.

When a code is present, category Product still names an HSN and Labour still names a SAC. A Bill line still copies that tax code and keeps the copy until the product is chosen again. The product still stores no CGST, SGST, or IGST rates. An Order still does not show or store HSN/SAC.
