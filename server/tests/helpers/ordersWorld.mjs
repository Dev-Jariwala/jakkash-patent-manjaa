import { randomUUID } from "node:crypto";
import { createInitialWhatsAppMetadata } from "../../services/whatsappBillMetadata.js";

export function createOrdersWorld({
  collectionId = randomUUID(),
  products = [],
} = {}) {
  const ordersById = new Map();
  const itemsByOrderId = new Map();
  const productStock = new Map(products.map((p) => [p.product_id, { ...p }]));

  function nextOrderNo(orderType) {
    let max = 0;
    for (const order of ordersById.values()) {
      if (order.collection_id === collectionId && order.order_type === orderType) {
        max = Math.max(max, order.order_no);
      }
    }
    return max + 1;
  }

  const store = {
    collectionId,
    ordersById,
    itemsByOrderId,
    productStock,

    createOrder(payload) {
      const order_id = randomUUID();
      const order = {
        order_id,
        collection_id: collectionId,
        ...payload,
        whatsapp_metadata: payload.whatsapp_metadata ?? createInitialWhatsAppMetadata(),
      };
      ordersById.set(order_id, order);
      itemsByOrderId.set(order_id, payload.order_items.map((item) => ({
        order_item_id: randomUUID(),
        order_id,
        ...item,
      })));
      for (const item of payload.order_items) {
        const prod = productStock.get(item.product_id);
        if (prod) prod.stock_in_hand -= item.quantity;
      }
      return order;
    },

    listOrders({ order_type, limit = 10, offset = 0 }) {
      const rows = [...ordersById.values()]
        .filter((o) => o.collection_id === collectionId && o.order_type === order_type)
        .sort((a, b) => b.order_no - a.order_no);
      return { orders: rows.slice(offset, offset + limit), total: rows.length };
    },

    getOrder(order_id) {
      const order = ordersById.get(order_id);
      if (!order || order.collection_id !== collectionId) return null;
      return {
        order,
        orderItems: itemsByOrderId.get(order_id) ?? [],
      };
    },

    updateOrder(order_id, patch, order_items) {
      const existing = ordersById.get(order_id);
      if (!existing) return null;
      const updated = { ...existing, ...patch };
      ordersById.set(order_id, updated);
      if (order_items) {
        itemsByOrderId.set(order_id, order_items.map((item) => ({
          order_item_id: randomUUID(),
          order_id,
          ...item,
        })));
      }
      return updated;
    },

    markDelivered(order_id, is_delivered) {
      const order = ordersById.get(order_id);
      if (!order) return null;
      if (is_delivered) {
        const nextAdvance = Number(order.advance) + Number(order.total_due);
        order.delivered_at = new Date().toISOString();
        order.advance = nextAdvance;
        order.total_due = 0;
      } else {
        order.delivered_at = null;
      }
      return order;
    },

    markPaid(order_id) {
      const order = ordersById.get(order_id);
      if (!order) return null;
      if (Number(order.total_due) <= 0) {
        return { order, already_paid: true };
      }
      order.advance = Number(order.advance) + Number(order.total_due);
      order.total_due = 0;
      return { order, already_paid: false };
    },

    getNextOrderNo(order_type) {
      return nextOrderNo(order_type);
    },
  };

  return { store, nextOrderNo };
}
