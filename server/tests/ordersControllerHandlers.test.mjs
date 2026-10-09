import assert from "node:assert/strict";
import { after, describe, it } from "node:test";

import {
  createOrder,
  getOrderById,
  getOrderReport,
  getWholeSaleOrdersByMobile,
  getWholesaleOrdersCsvReport,
  updateOrderPaymentStatus,
} from "../controllers/orders.js";
import { __setWhatsAppBillDeliveryJobAddForTests } from "../services/whatsappBillDeliveryEnqueue.js";
import {
  createInitialWhatsAppMetadata,
  WHATSAPP_DELIVERY_STATUS,
} from "../services/whatsappBillMetadata.js";
import { __setQueryImplementationForTests } from "../utils/query.js";
import { createMockResponse } from "./helpers/fixtures.mjs";

const collectionId = "22222222-2222-2222-2222-222222222222";
const orderId = "11111111-1111-1111-1111-111111111111";

const sampleOrder = {
  order_id: orderId,
  collection_id: collectionId,
  order_no: 101,
  order_type: "retail",
  mobile: "9876543210",
  name: "Client",
  address: "Addr",
  order_date: "2026-01-01T00:00:00.000Z",
  delivery_date: "2026-01-02T00:00:00.000Z",
  total_due: 400,
  advance: 100,
  sub_total: 500,
  discount: 0,
  whatsapp_metadata: createInitialWhatsAppMetadata(),
};

const productId = "33333333-3333-3333-3333-333333333333";

function buildCreateOrderRequest({ send_order_on_whatsapp = false } = {}) {
  const product = {
    product_id: productId,
    retail_price: 250,
    wholesale_price: 200,
    stock_in_hand: 10,
  };
  return {
    params: { collection_id: collectionId },
    body: {
      order_no: 55,
      order_type: "retail",
      mobile: "9876543210",
      name: "Client",
      address: "Addr",
      order_date: "2026-01-01T00:00:00.000Z",
      delivery_date: "2026-01-02T00:00:00.000Z",
      notes: "",
      total_firki: 1,
      sub_total: 250,
      discount: 0,
      advance: 0,
      total_due: 250,
      order_items: [{ product_id: productId, quantity: 1 }],
      send_order_on_whatsapp,
    },
    products: [product],
  };
}

function createOrderQueryMock({ whatsappServiceEnabled = true } = {}) {
  return async (sql, values) => {
    const text = String(sql).toLowerCase();

    if (text.includes("app_settings")) {
      return [{ setting_value: whatsappServiceEnabled }];
    }
    if (text.includes("insert into orders")) {
      const whatsapp_metadata = values[15];
      return [
        {
          order_id: orderId,
          collection_id: values[0],
          order_no: values[1],
          order_type: values[2],
          mobile: values[4],
          name: values[5],
          address: values[6],
          whatsapp_metadata,
        },
      ];
    }
    if (text.includes("insert into order_items")) {
      return [{ order_item_id: "item-1", order_id: values[0], product_id: values[1], quantity: values[2], price: values[3] }];
    }
    if (text.includes("update products set stock_in_hand")) {
      return [{ stock_in_hand: 9 }];
    }
    if (text.includes("from clients where mobile")) {
      return [];
    }
    if (text.includes("insert into clients")) {
      return [{ client_id: "client-1", mobile: values[1], name: values[0], address: values[2] }];
    }
    if (text.includes("update orders") && text.includes("whatsapp_metadata")) {
      const metadata =
        typeof values[0] === "string" ? JSON.parse(values[0]) : values[0];
      return [
        {
          order_id: values[1],
          collection_id: values[2],
          whatsapp_metadata: metadata,
        },
      ];
    }
    return [];
  };
}

after(() => {
  __setQueryImplementationForTests(null);
  __setWhatsAppBillDeliveryJobAddForTests(null);
});

describe("orders controller handlers (regression)", () => {
  it("getOrderById returns the order row without referencing bill", async () => {
    __setQueryImplementationForTests(async (sql) => {
      if (String(sql).includes("order_items")) {
        return [{ order_item_id: "item-1", quantity: 2, price: 50, product_name: "Manja" }];
      }
      return [{ ...sampleOrder }];
    });

    const res = createMockResponse();
    await getOrderById(
      { params: { order_id: orderId, collection_id: collectionId } },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.order.order_id, orderId);
    assert.equal(res.body.orderItems.length, 1);
  });

  it("getOrderById responds 404 when the order row is missing", async () => {
    __setQueryImplementationForTests(async () => []);

    const res = createMockResponse();
    await getOrderById(
      { params: { order_id: orderId, collection_id: collectionId } },
      res
    );

    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, "Order not found");
  });

  it("updateOrderPaymentStatus marks the order paid", async () => {
    __setQueryImplementationForTests(async (sql) => {
      if (String(sql).toLowerCase().startsWith("update orders")) {
        return [{ ...sampleOrder, advance: 500, total_due: 0 }];
      }
      return [{ ...sampleOrder }];
    });

    const res = createMockResponse();
    await updateOrderPaymentStatus(
      {
        params: { order_id: orderId, collection_id: collectionId },
        body: { mark_as_paid: true },
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.already_paid, false);
    assert.equal(res.body.order.total_due, 0);
    assert.equal(res.body.order.advance, 500);
  });

  it("getOrderReport returns queried rows under orders", async () => {
    const reportRows = [
      { order_no: 10, name: "Acme", total_firki: 3 },
      { order_no: 11, name: "Beta", total_firki: 1 },
    ];
    let boundRange;
    __setQueryImplementationForTests(async (_sql, values) => {
      boundRange = values?.slice(2);
      return reportRows;
    });

    const res = createMockResponse();
    await getOrderReport(
      {
        params: { collection_id: collectionId, order_type: "retail" },
        query: { fromBillNo: "10", toBillNo: "11" },
      },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.orders, reportRows);
    assert.deepEqual(boundRange, [10, 11]);
  });

  it("getOrderReport rejects a non-numeric range before querying", async () => {
    __setQueryImplementationForTests(async () => {
      throw new Error("query should not run");
    });

    const res = createMockResponse();
    await getOrderReport(
      {
        params: { collection_id: collectionId, order_type: "retail" },
        query: { fromBillNo: "`", toBillNo: "100" },
      },
      res
    );

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, "Order numbers must be whole numbers.");
  });

  it("getWholesaleOrdersCsvReport returns wholesale rows under wholesale_orders", async () => {
    const rows = [{ order_no: 1, order_type: "wholesale" }];
    __setQueryImplementationForTests(async () => rows);

    const res = createMockResponse();
    await getWholesaleOrdersCsvReport(
      { params: { collection_id: collectionId } },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.wholesale_orders, rows);
  });

  it("getWholeSaleOrdersByMobile returns client orders under orders", async () => {
    const orderRows = [{ order_no: 5, order_items: [] }];
    __setQueryImplementationForTests(async (sql) => {
      if (String(sql).includes("FROM orders o")) {
        return orderRows;
      }
      return [];
    });

    const res = createMockResponse();
    await getWholeSaleOrdersByMobile(
      { params: { mobile: "9876543210", collection_id: collectionId } },
      res
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.orders, orderRows);
    assert.equal(res.body.bills, undefined);
  });
});

describe("createOrder WhatsApp on create (regression)", () => {
  it("leaves delivery unrequested when send_order_on_whatsapp is false", async () => {
    __setQueryImplementationForTests(createOrderQueryMock());
    __setWhatsAppBillDeliveryJobAddForTests(null);

    const res = createMockResponse();
    await createOrder(buildCreateOrderRequest({ send_order_on_whatsapp: false }), res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.order.whatsapp_metadata.delivery_requested, false);
    assert.equal(res.body.whatsapp_delivery, undefined);
  });

  it("requests delivery and returns the enqueued order row when the checkbox is on", async () => {
    __setQueryImplementationForTests(createOrderQueryMock({ whatsappServiceEnabled: true }));
    __setWhatsAppBillDeliveryJobAddForTests(async () => ({ id: "job-test-1" }));

    const res = createMockResponse();
    await createOrder(buildCreateOrderRequest({ send_order_on_whatsapp: true }), res);

    assert.equal(res.statusCode, 201);
    assert.ok(res.body.order, "response must include the order returned from enqueue");
    assert.equal(res.body.order.order_id, orderId);
    assert.equal(res.body.order.whatsapp_metadata.delivery_requested, true);
    assert.equal(res.body.order.whatsapp_metadata.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
    assert.equal(res.body.whatsapp_delivery?.queued, true);
    assert.equal(res.body.whatsapp_delivery?.status, WHATSAPP_DELIVERY_STATUS.PROCESSING);
  });
});
