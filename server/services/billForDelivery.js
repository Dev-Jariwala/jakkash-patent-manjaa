import { query } from "../utils/query.js";

export async function fetchBillForDelivery({ billId, collectionId }) {
  const [bill] = await query(
    `SELECT o.*, c.name AS client_name
     FROM orders o
     LEFT JOIN clients c ON o.mobile = c.mobile
     WHERE o.order_id = $1 AND o.collection_id = $2`,
    [billId, collectionId]
  );

  if (!bill) {
    const error = new Error(`Bill ${billId} not found`);
    error.code = "BILL_NOT_FOUND";
    throw error;
  }

  const billItems = await query(
    `SELECT order_items.*, products.product_name
     FROM order_items
     LEFT JOIN products ON order_items.product_id = products.product_id
     WHERE order_id = $1`,
    [billId]
  );

  return {
    ...bill,
    products: billItems,
  };
}
