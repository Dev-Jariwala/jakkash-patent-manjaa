# Bill is not an Order and does not move stock

**Status:** Superseded by [ADR-0026](0026-bills-deduct-stock-on-create-and-reconcile-on-update.md).

A Bill is a GST document typed in directly for one collection. It is not created from an Order, and saving a Bill does not reduce or increase stock.

The rejected alternatives were raising a Bill from an Order and reducing stock the way an Order does. Those would tie the GST document to the commercial sale record and make two documents change inventory for one action.

Orders remain the record that moves stock. The Bills screen lists, adds, and edits Bills only through the bill module.
