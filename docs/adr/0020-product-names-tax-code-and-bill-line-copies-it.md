# Product names the tax code and the Bill line copies it

A product names one tax code by id. On a Bill, choosing a product copies that product's current tax code id, code, and catalog description onto the line, along with editable CGST, SGST, and IGST percents. A saved line keeps that copy until the operator chooses the product again on that line, including choosing the same product. Saving without a fresh product choice does not pick up a new tax code on the product, new digits or description on Masters, or defaults from the catalog row.

The rejected alternatives were an HSN/SAC select the operator could still change on the Bill, an optional tax code on the product, any tax code on any category, CGST/SGST/IGST stored on the product, digits frozen on the product instead of following Masters, and HSN/SAC on Orders. Those would let a line diverge from the product without an explicit choice, blur category rules, or rewrite historical Bills when masters change.
