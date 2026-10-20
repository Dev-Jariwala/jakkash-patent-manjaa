Status: ready-for-agent

## What to build

Include all products copies each product's name, category, and tax code into the new collection. Cotton stays a Product and keeps its HSN. Stitching stays Labour and keeps its SAC. A product with no tax code is copied without one. Wholesale price, retail price, stock in hand, and total stock on the copy are 0. The collection the products were copied from keeps its prices, its stock, its category, and its tax code.

The new product stores the tax code id of the same Masters row. It does not store CGST, SGST, or IGST. Two products that share one HSN both keep it. A product name that contains a quote or a comma is copied intact. Leaving Include all products unticked creates the collection with no products.

The products list in the new collection shows the copied HSN or SAC, and a blank cell when the copy has no tax code. A Bill in the new collection can use a copied product that has a tax code. A copied product with no tax code stays off a new Bill line. Orders are unchanged.

The product module is the only place that decides the copy. One decision records that the copy takes the name, the category, and the tax code, and that price and stock start at 0. The rejected alternative is copying the stock and both prices as well. The Product tax code PRD no longer says this copy is out of scope.

## Acceptance criteria

- [ ] Cotton is copied as Product with the same HSN, and with wholesale price, retail price, stock in hand, and total stock at 0
- [ ] Stitching is copied as Labour with the same SAC, and with prices and stock at 0
- [ ] A product with no tax code is copied without one, and the list shows a blank HSN/SAC cell
- [ ] Two products that share an HSN both keep it, and a name that contains a quote is copied intact
- [ ] The source collection keeps its prices, stock, category, and tax code
- [ ] Include all products left unticked creates a collection with no products
- [ ] A Bill in the new collection can use a copied product that has a tax code, and a copied product with no tax code stays off a new Bill line
- [ ] Orders are unchanged
- [ ] Tests on the product module, using an in-memory stand-in, cover the Cotton copy, the Stitching copy, a product with no tax code, a shared HSN, a name with a quote, the unchanged source collection, and an empty collection when the box is unticked
- [ ] One decision records the copy, and the rejected alternative is copying the stock and both prices

## Blocked by

None - can start immediately
