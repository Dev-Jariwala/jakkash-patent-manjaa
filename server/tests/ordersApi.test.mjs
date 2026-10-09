import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { randomUUID } from "node:crypto";

import { createOrdersWorld } from "./helpers/ordersWorld.mjs";
import { createInitialWhatsAppMetadata } from "../services/whatsappBillMetadata.js";

describe("orders API (in-memory store)", () => {
  const productId = randomUUID();
  const baseItem = { product_id: productId, quantity: 2, price: 250 };

  function samplePayload(overrides = {}) {
    return {
      order_no: 1,
      order_type: "retail",
      mobile: "9876543210",
      name: "Test Client",
      address: "12 Market Road",
      order_date: "2026-01-01T00:00:00.000Z",
      delivery_date: "2026-01-05T00:00:00.000Z",
      notes: "",
      total_firki: 2,
      sub_total: 500,
      discount: 0,
      advance: 100,
      total_due: 400,
      order_items: [baseItem],
      whatsapp_metadata: createInitialWhatsAppMetadata({ deliveryRequested: true }),
      ...overrides,
    };
  }

  it("creates an order with line items and WhatsApp metadata", () => {
    const { store } = createOrdersWorld({
      products: [{ product_id: productId, stock_in_hand: 10, retail_price: 250, wholesale_price: 200 }],
    });
    const order = store.createOrder(samplePayload());

    assert.equal(order.order_no, 1);
    assert.equal(order.order_type, "retail");
    assert.equal(order.total_due, 400);
    assert.equal(order.whatsapp_metadata.status, "no");
    const fetched = store.getOrder(order.order_id);
    assert.equal(fetched.orderItems.length, 1);
    assert.equal(fetched.orderItems[0].quantity, 2);
  });

  it("lists orders by type with paging", () => {
    const { store } = createOrdersWorld({
      products: [{ product_id: productId, stock_in_hand: 100, retail_price: 250, wholesale_price: 200 }],
    });
    store.createOrder(samplePayload({ order_no: 1, order_type: "retail" }));
    store.createOrder(samplePayload({ order_no: 2, order_type: "retail" }));
    store.createOrder(samplePayload({ order_no: 1, order_type: "wholesale" }));

    const retail = store.listOrders({ order_type: "retail", limit: 10, offset: 0 });
    assert.equal(retail.total, 2);
    assert.equal(retail.orders[0].order_no, 2);
    const wholesale = store.listOrders({ order_type: "wholesale" });
    assert.equal(wholesale.total, 1);
  });

  it("fetches one order by id", () => {
    const { store } = createOrdersWorld({
      products: [{ product_id: productId, stock_in_hand: 10, retail_price: 250, wholesale_price: 200 }],
    });
    const created = store.createOrder(samplePayload());
    const fetched = store.getOrder(created.order_id);
    assert.equal(fetched.order.mobile, "9876543210");
    assert.equal(fetched.orderItems[0].price, 250);
  });

  it("updates totals and line items", () => {
    const { store } = createOrdersWorld({
      products: [{ product_id: productId, stock_in_hand: 10, retail_price: 250, wholesale_price: 200 }],
    });
    const created = store.createOrder(samplePayload());
    const updated = store.updateOrder(
      created.order_id,
      { total_due: 300, sub_total: 500 },
      [{ ...baseItem, quantity: 2, price: 250 }]
    );
    assert.equal(updated.total_due, 300);
  });

  it("continues the next order number per collection and type", () => {
    const { store } = createOrdersWorld();
    store.createOrder(samplePayload({ order_no: 5, order_type: "retail" }));
    store.createOrder(samplePayload({ order_no: 2, order_type: "wholesale" }));
    assert.equal(store.getNextOrderNo("retail"), 6);
    assert.equal(store.getNextOrderNo("wholesale"), 3);
  });

  it("marks an order paid and delivered", () => {
    const { store } = createOrdersWorld();
    const created = store.createOrder(samplePayload());
    const paid = store.markPaid(created.order_id);
    assert.equal(paid.already_paid, false);
    assert.equal(paid.order.total_due, 0);
    assert.equal(paid.order.advance, 500);

    const delivered = store.markDelivered(created.order_id, true);
    assert.ok(delivered.delivered_at);
  });
});
