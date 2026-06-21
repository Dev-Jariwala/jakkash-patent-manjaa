import { query } from "../utils/query.js";

export async function persistWhatsAppMetadata({ billId, collectionId, metadata }) {
  const [updatedBill] = await query(
    `UPDATE bills
     SET whatsapp_metadata = $1::jsonb
     WHERE bill_id = $2 AND collection_id = $3
     RETURNING *`,
    [JSON.stringify(metadata), billId, collectionId]
  );

  if (!updatedBill) {
    throw new Error("Failed to persist WhatsApp delivery metadata");
  }

  return updatedBill;
}
