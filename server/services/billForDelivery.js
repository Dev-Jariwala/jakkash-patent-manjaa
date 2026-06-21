import { query } from "../utils/query.js";

export async function fetchBillForDelivery({ billId, collectionId }) {
  const [bill] = await query(
    `SELECT b.*, c.name AS client_name
     FROM bills b
     LEFT JOIN clients c ON b.mobile = c.mobile
     WHERE b.bill_id = $1 AND b.collection_id = $2`,
    [billId, collectionId]
  );

  if (!bill) {
    const error = new Error(`Bill ${billId} not found`);
    error.code = "BILL_NOT_FOUND";
    throw error;
  }

  const billItems = await query(
    `SELECT bill_items.*, products.product_name
     FROM bill_items
     LEFT JOIN products ON bill_items.product_id = products.product_id
     WHERE bill_id = $1`,
    [billId]
  );

  return {
    ...bill,
    products: billItems,
  };
}
