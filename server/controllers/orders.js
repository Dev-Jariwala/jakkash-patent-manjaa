// controllers/orders.js

import { handleError } from "../utils/error.js";
import { query } from "../utils/query.js";
import { assertWhatsAppServiceEnabled } from "../services/whatsappServiceSetting.js";
import { resolveCreateBillWhatsAppMetadata } from "../services/whatsappBillMetadata.js";
import { enqueueBillWhatsAppDelivery as enqueueOrderWhatsAppDelivery } from "../services/whatsappBillDeliveryEnqueue.js";
import { resendBillWhatsAppDelivery as resendOrderWhatsAppDeliveryService } from "../services/whatsappBillDeliveryResend.js";
import { forceCancelBillWhatsAppDelivery as forceCancelOrderWhatsAppDeliveryService } from "../services/whatsappBillDeliveryCancel.js";
import {
  assertBillEditableDuringWhatsAppDelivery,
  assertBillEditableFromMetadata,
  BILL_EDITABLE_SQL_CONDITION,
  EDIT_BLOCKING_STATUSES_PARAM,
  explainRejectedBillUpdate,
} from "../services/whatsappBillEditGuard.js";
import { applyBillCreateClientSync } from "../services/clientMaintenance.js";
import {
  createClientMaintenanceDeps,
  getClientByMobileWithLocation,
} from "../services/clientMaintenanceStore.js";

// CREATE TABLE bills (
// 	   sr_no SERIAL PRIMARY KEY,
//     order_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
//     collection_id UUID NOT NULL REFERENCES collections(collection_id),
//     order_no INT NOT NULL,
//     order_type VARCHAR(50) CHECK (order_type IN ('retail','wholesale')),
//     UNIQUE (collection_id, order_no, order_type),
//     mobile VARCHAR(20) NOT NULL,
//     name VARCHAR(100) NOT NULL,
//     address VARCHAR(500) NOT NULL,
//     order_date TIMESTAMPTZ NOT NULL,
//     delivery_date TIMESTAMPTZ NOT NULL,
//     notes TEXT,
//     total_firki INT NOT NULL,
//     sub_total FLOAT NOT NULL,
//     discount FLOAT NOT NULL,
//     advance FLOAT NOT NULL,
//     total_due FLOAT NOT NULL
// );

// CREATE TABLE order_items (
// 	   sr_no SERIAL PRIMARY KEY,
//     order_item_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
//     order_id UUID NOT NULL REFERENCES bills(order_id),
//     product_id UUID NOT NULL REFERENCES products(product_id),
//     quantity INT NOT NULL,
//     price FLOAT NOT NULL,
//     UNIQUE (order_id , product_id)
// );

// CREATE TABLE clients (
// 	sr_no SERIAL PRIMARY KEY,
//     client_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
//     name VARCHAR(100) NOT NULL,
//     mobile VARCHAR(20) NOT NULL UNIQUE,
//     address VARCHAR(255) NOT NULL
// );

export const createOrder = async (req, res, next) => {
  const { order_no, order_type, name, address, mobile, notes, total_firki, sub_total, advance, discount, total_due, order_date, delivery_date, order_items, is_delivered = false, send_order_on_whatsapp = false } = req.body;
  const products = req.products || [];
  const { collection_id } = req.params;
  try {
    // The toggle only changes metadata when delivery was actually requested, so
    // one guarded lookup covers both enforcement and the metadata decision.
    // Same guard the resend flow uses, so a stale frontend cannot slip past it.
    const serviceEnabled = send_order_on_whatsapp
      ? await assertWhatsAppServiceEnabled()
      : false;

    const whatsapp_metadata = resolveCreateBillWhatsAppMetadata({
      serviceEnabled,
      sendBillOnWhatsApp: send_order_on_whatsapp,
    });

    const [newOrder] = await query(
      `insert into orders 
        (collection_id, order_no, order_type, mobile, name, address, order_date, delivery_date, notes, total_firki, sub_total, discount, advance, total_due, delivered_at, whatsapp_metadata)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) returning *`,
      [collection_id, order_no, order_type, mobile, name, address, order_date, delivery_date, notes, total_firki, sub_total, discount, advance, total_due, is_delivered ? 'now()' : null, whatsapp_metadata]
    );
    if (!newOrder) {
      return res.status(400).json({ message: 'Error creating order', error: 'Error creating order' })
    }
    const orderItems = await Promise.all(order_items.map(async (order_item) => {
      const prod = products?.find(prod => prod.product_id === order_item.product_id);
      const price = prod[`${order_type}_price`];
      const [newOrderItem] = await query(
        `insert into order_items 
              ( order_id, product_id, quantity, price)
              values ($1, $2, $3, $4) returning *`,
        [newOrder?.order_id, order_item.product_id, order_item.quantity, price]
      );
      if (!newOrderItem) {
        return res.status(400).json({ message: 'Error creating order item', error: 'Error creating order item' })
      }
      const [updatedProduct] = await query(
        "update products set stock_in_hand = $1 where product_id = $2 and collection_id =$3 returning *",
        [prod.stock_in_hand - order_item.quantity, order_item.product_id, collection_id]
      );
      if (!updatedProduct) {
        console.log({ message: `Error updating stock in createOrder ${newOrder?.order_id}`, error: `Error updating stock in createOrder ${newOrder?.order_id}` })
      }
      return { orderItem: newOrderItem, product: updatedProduct };
    }));
    const client = await applyBillCreateClientSync(createClientMaintenanceDeps(), {
      mobile,
      name,
      address,
    });

    let orderForResponse = newOrder;
    let whatsappDelivery;
    if (whatsapp_metadata.delivery_requested) {
      try {
        const { bill: updatedOrder } = await enqueueOrderWhatsAppDelivery({
          billId: newOrder.order_id,
          collectionId: collection_id,
          whatsappMetadata: whatsapp_metadata,
        });
        orderForResponse = updatedOrder;
        whatsappDelivery = {
          queued: true,
          status: updatedOrder?.whatsapp_metadata?.status || "processing",
        };
      } catch (enqueueError) {
        console.error(`Error enqueueing WhatsApp delivery for order ${newOrder.order_id}:`, enqueueError);
        if (enqueueError.bill) {
          orderForResponse = enqueueError.bill;
        }
        whatsappDelivery = {
          queued: false,
          status: orderForResponse?.whatsapp_metadata?.status || "failed",
          warning: enqueueError.message,
        };
      }
    }

    res.status(201).json({
      message: "Order created successfully",
      order: orderForResponse,
      orderItems,
      ...(whatsappDelivery && { whatsapp_delivery: whatsappDelivery }),
    });
  } catch (error) {
    handleError('createOrder', res, error);
  }
};

export const resendOrderWhatsAppDelivery = async (req, res) => {
  const { order_id, collection_id } = req.params;
  try {
    const order = await resendOrderWhatsAppDeliveryService({
      billId: order_id,
      collectionId: collection_id,
    });

    res.status(202).json({
      message: "WhatsApp order delivery queued successfully",
      order,
      whatsapp_delivery: {
        queued: true,
        status: order?.whatsapp_metadata?.status || "processing",
      },
    });
  } catch (error) {
    if (error.name === "EnqueueWhatsAppDeliveryError") {
      console.error(`Error enqueueing WhatsApp resend for order ${order_id}:`, error);
      return res.status(502).json({
        success: false,
        message: error.message || "Failed to queue WhatsApp order delivery",
        code: "WHATSAPP_RESEND_ENQUEUE_FAILED",
        order: error.bill,
        whatsapp_delivery: {
          queued: false,
          status: error.bill?.whatsapp_metadata?.status || "failed",
          warning: error.message,
        },
      });
    }

    handleError('resendOrderWhatsAppDelivery', res, error);
  }
};

export const forceCancelOrderWhatsAppDelivery = async (req, res) => {
  const { order_id, collection_id } = req.params;
  try {
    const { bill: order, jobRemoved, jobState, workerAbortPending } =
      await forceCancelOrderWhatsAppDeliveryService({
        billId: order_id,
        collectionId: collection_id,
      });

    res.status(200).json({
      message: workerAbortPending
        ? "WhatsApp order delivery canceled. The attempt already in progress will stop shortly."
        : "WhatsApp order delivery canceled",
      order,
      whatsapp_delivery: {
        status: order?.whatsapp_metadata?.status || "canceled",
        job_removed: jobRemoved,
        job_state: jobState,
        worker_abort_pending: workerAbortPending,
      },
    });
  } catch (error) {
    handleError('forceCancelOrderWhatsAppDelivery', res, error);
  }
};

/**
 * Sortable bill columns. An identifier cannot be a bound parameter, so the only
 * safe way to accept one from the query string is to map it onto a known column
 * here; anything else falls back to the default ordering.
 */
export const ORDER_SORT_FIELDS = {
  order_no: "o.order_no",
  order_date: "o.order_date",
  delivery_date: "o.delivery_date",
  name: "o.name",
  mobile: "o.mobile",
  total_due: "o.total_due",
  sub_total: "o.sub_total",
  total_firki: "o.total_firki",
  delivered_at: "o.delivered_at",
};
const DEFAULT_ORDER_SORT_FIELD = "o.order_no";
const MAX_ORDERS_PAGE_SIZE = 200;

export function resolveOrdersListOrdering({ sortField, sortOrder }) {
  // Own-property lookup only: a plain index would resolve `constructor` or
  // `toString` off `Object.prototype` and splice that value into the ORDER BY.
  const column = Object.hasOwn(ORDER_SORT_FIELDS, String(sortField))
    ? ORDER_SORT_FIELDS[sortField]
    : DEFAULT_ORDER_SORT_FIELD;

  return {
    column,
    direction: String(sortOrder).toLowerCase() === "asc" ? "ASC" : "DESC",
  };
}

export function resolveOrdersListPagination({ page, limit }) {
  const parsedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const parsedLimit = Math.min(
    MAX_ORDERS_PAGE_SIZE,
    Math.max(1, Number.parseInt(limit, 10) || 10)
  );

  return { page: parsedPage, limit: parsedLimit, offset: (parsedPage - 1) * parsedLimit };
}

export const getOrders = async (req, res) => {
  const { collection_id } = req.params;
  const { page: rawPage, limit: rawLimit, sortField, sortOrder, search = "", order_type } = req.query;
  if (!order_type) {
    return res.status(400).json({ message: 'Error fetching orders', error: 'Order type is required' })
  }

  const { page, limit, offset } = resolveOrdersListPagination({ page: rawPage, limit: rawLimit });
  const { column, direction } = resolveOrdersListOrdering({ sortField, sortOrder });

  try {
    // The list and the count share one filter, so the pager can never report a
    // page count the list cannot fill. Every value is bound; the only
    // interpolated fragments are the ordering identifiers, which come from the
    // whitelist above.
    const filterParams = [collection_id, order_type];
    if (search) {
      filterParams.push(`%${search}%`);
    }
    const fromAndWhere = `
      FROM orders o
      LEFT JOIN clients c ON o.mobile = c.mobile
      WHERE o.collection_id = $1
        AND o.order_type = $2
        ${search
        ? `AND (
             c.name ILIKE $3
             OR o.name ILIKE $3
             OR o.mobile ILIKE $3
             OR o.order_no::text ILIKE $3
             OR o.order_id::text ILIKE $3
           )`
        : ""}
    `;

    // Placed after the filter params so the indexes stay correct whether or not
    // a search term is present.
    const searchParam = filterParams.length + 1;
    const limitParam = filterParams.length + 2;
    const offsetParam = filterParams.length + 3;

    const orders = await query(
      `SELECT o.*, c.name AS client_name
       ${fromAndWhere}
       ORDER BY
         CASE WHEN o.order_no::text = $${searchParam}::text THEN 0 ELSE 1 END,
         ${column} ${direction}
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filterParams, String(search), limit, offset]
    );

    const [{ total_count }] = await query(
      `SELECT COUNT(*) AS total_count ${fromAndWhere}`,
      filterParams
    );

    res.status(200).json({ message: "Orders retrieved successfully", pagination: { page, limit, totalPages: Math.ceil(parseInt(total_count) / limit), totalItems: parseInt(total_count), }, orders, });
  } catch (error) {
    handleError('getOrders', res, error);
  }
};

export const getOrderById = async (req, res) => {
  const { order_id, collection_id } = req.params;

  try {
    const [order] = await query(`SELECT o.*, c.name AS client_name FROM orders o LEFT JOIN clients c ON o.mobile = c.mobile WHERE o.order_id = $1 AND o.collection_id =$2`, [order_id, collection_id]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderItems = await query(`SELECT order_items.*, products.product_name FROM order_items left join products on order_items.product_id = products.product_id WHERE order_id = $1`, [order_id]);

    res.status(200).json({ message: 'Order retrieved successfully', order, orderItems });
  } catch (error) {
    handleError('getOrderById', res, error);
  }
};

export const getNextOrderNo = async (req, res) => {
  const { collection_id } = req.params;
  const { order_type } = req.query;
  try {
    const [row] = await query(`SELECT max(order_no) as order_no FROM orders WHERE collection_id = $1 AND order_type = $2`, [collection_id, order_type]);
    res.status(200).json({ message: 'Order number retrieved successfully', order_no: row?.order_no + 1 || 0 });
  } catch (error) {
    handleError('getNextOrderNo', res, error);
  }
};

export const updateOrderById = async (req, res) => {
  const { order_id, collection_id } = req.params;
  const { order_no, order_type, name, address, mobile, notes, total_firki, sub_total, advance, discount, total_due, order_date, delivery_date, order_items, } = req.body;
  const products = req.products || [];
  try {
    // A bill with a delivery in flight is off limits to the normal update path
    // (ADR 0005). Checked before any write so a blocked edit never leaves
    // half-applied bill item or stock changes behind.
    await assertBillEditableDuringWhatsAppDelivery({ billId: order_id, collectionId: collection_id });

    const [updatedOrder] = await query(
      `update orders set order_no = $1, order_type = $2, mobile = $3, name = $4, address = $5, order_date = $6, delivery_date = $7, notes = $8, total_firki = $9, sub_total = $10, discount = $11, advance = $12, total_due = $13 where order_id = $14 and collection_id = $15 and ${BILL_EDITABLE_SQL_CONDITION('$16')} returning *`,
      [order_no, order_type, mobile, name, address, order_date, delivery_date, notes, total_firki, sub_total, discount, advance, total_due, order_id, collection_id, EDIT_BLOCKING_STATUSES_PARAM]
    );
    if (!updatedOrder) {
      // A delivery can be enqueued between the check above and this write, so
      // report the state the bill actually landed in.
      throw await explainRejectedBillUpdate({ billId: order_id, collectionId: collection_id });
    }

    const previousOrderItems = await query(`SELECT * FROM order_items WHERE order_id = $1`, [order_id]);

    // Delete bill items that are not in the new order_items
    const previousOrderItemIds = previousOrderItems.map(item => item.product_id);
    const newOrderItemIds = order_items.map(item => item.product_id);
    const itemsToDelete = previousOrderItemIds.filter(id => !newOrderItemIds.includes(id));

    await Promise.all(itemsToDelete.map(async (product_id) => {
      const [deletedOrderItem] = await query(`DELETE FROM order_items WHERE order_id = $1 AND product_id = $2 returning *`, [order_id, product_id]);
      console.log({ deletedOrderItem });
      if (deletedOrderItem) {
        const [prod] = await query("select * from products where product_id = $1 and collection_id =$2", [product_id, collection_id]);
        console.log({ prod });
        await query("update products set stock_in_hand = $1 where product_id = $2 and collection_id =$3", [prod.stock_in_hand + deletedOrderItem.quantity, product_id, collection_id]);
      }
    }));

    const orderItems = await Promise.all(order_items.map(async (order_item) => {
      const [prod] = await query("select * from products where product_id = $1 and collection_id =$2", [order_item.product_id, collection_id]);
      const price = prod[`${order_type}_price`];
      const previousOrderItem = previousOrderItems.find(bi => bi.product_id === order_item.product_id);

      if (!previousOrderItem) {
        const [newOrderItem] = await query(
          `insert into order_items (order_id, product_id, quantity, price) values ($1, $2, $3, $4) returning *`,
          [order_id, order_item.product_id, order_item.quantity, price]
        );
        if (!newOrderItem) {
          return res.status(400).json({ message: 'Error creating order item', error: 'Error creating order item' });
        }
        await query("update products set stock_in_hand = $1 where product_id = $2 and collection_id =$3", [prod.stock_in_hand - order_item.quantity, order_item.product_id, collection_id]);
        return { orderItem: newOrderItem, product: prod };
      }

      if (previousOrderItem.quantity !== order_item.quantity) {
        const [updatedOrderItem] = await query(
          `update order_items set quantity = $1 where order_id = $2 and product_id = $3 returning *`,
          [order_item.quantity, order_id, order_item.product_id]
        );
        if (!updatedOrderItem) {
          return res.status(400).json({ message: 'Error updating order item', error: 'Error updating order item' });
        }
        await query("update products set stock_in_hand = $1 where product_id = $2 and collection_id =$3", [prod.stock_in_hand - (order_item.quantity - previousOrderItem.quantity), order_item.product_id, collection_id]);
        return { orderItem: updatedOrderItem, product: prod };
      }

      return { orderItem: previousOrderItem, product: prod };
    }));

    res.status(200).json({ message: "Order updated successfully", order: updatedOrder, orderItems });
  } catch (error) {
    handleError('updateOrderById', res, error);
  }
};

export const updateOrderDeliveryStatus = async (req, res) => {
  const { order_id, collection_id } = req.params;
  const { is_delivered } = req.body;
  try {
    const [order] = await query(`select * from orders where order_id = $1 and collection_id = $2`, [order_id, collection_id]);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if ((order.delivered_at && is_delivered) || (!order.delivered_at && !is_delivered)) {
      return res.status(400).json({ message: 'Order delivery status is already ' + (is_delivered ? 'delivered' : 'not delivered') });
    }

    // Marking delivered rolls total_due into advance, and both are printed on
    // the bill PDF, so this is a bill change like any other and must not land
    // while a delivery is generating that PDF (ADR 0005).
    assertBillEditableFromMetadata(order.whatsapp_metadata);

    const nextAdvance = is_delivered && Number(order.total_due) > 0
      ? Number(order.advance) + Number(order.total_due)
      : Number(order.advance);
    const nextTotalDue = is_delivered ? 0 : Number(order.total_due);

    const [updatedOrder] = await query(
      `update orders set delivered_at = $1, advance = $2, total_due = $3 where order_id = $4 and collection_id = $5 and ${BILL_EDITABLE_SQL_CONDITION('$6')} returning *`,
      [is_delivered ? 'now()' : null, nextAdvance, nextTotalDue, order_id, collection_id, EDIT_BLOCKING_STATUSES_PARAM]
    );
    if (!updatedOrder) {
      throw await explainRejectedBillUpdate({
        billId: order_id,
        collectionId: collection_id,
        fallbackMessage: 'Error updating order delivery status',
      });
    }
    res.status(200).json({ message: 'Order delivery status updated successfully', order: updatedOrder });
  } catch (error) {
    handleError('updateOrderDeliveryStatus', res, error);
  }
};

export const updateOrderPaymentStatus = async (req, res) => {
  const { order_id, collection_id } = req.params;
  const { mark_as_paid } = req.body;

  try {
    const [order] = await query(`select * from orders where order_id = $1 and collection_id = $2`, [order_id, collection_id]);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!mark_as_paid) {
      return res.status(400).json({ message: 'mark_as_paid must be true' });
    }

    if (Number(order.total_due) <= 0) {
      return res.status(200).json({
        message: 'Order is already paid',
        already_paid: true,
        order,
      });
    }

    // advance and total_due are both printed on the bill PDF, so marking paid
    // mid-delivery would send a document the operator never reviewed (ADR 0005).
    assertBillEditableFromMetadata(order.whatsapp_metadata);

    const nextAdvance = Number(order.advance) + Number(order.total_due);

    const [updatedOrder] = await query(
      `update orders set advance = $1, total_due = $2 where order_id = $3 and collection_id = $4 and ${BILL_EDITABLE_SQL_CONDITION('$5')} returning *`,
      [nextAdvance, 0, order_id, collection_id, EDIT_BLOCKING_STATUSES_PARAM]
    );

    if (!updatedOrder) {
      throw await explainRejectedBillUpdate({
        billId: order_id,
        collectionId: collection_id,
        fallbackMessage: 'Error updating order payment status',
      });
    }

    res.status(200).json({
      message: 'Order marked as paid successfully',
      already_paid: false,
      order: updatedOrder,
    });
  } catch (error) {
    handleError('updateOrderPaymentStatus', res, error);
  }
};

export const getAllOrders = async (req, res) => {
  const { collection_id } = req.params;
  try {
    const orders = await query(`SELECT * FROM orders WHERE collection_id = $1`, [collection_id]);
    res.status(200).json({ message: 'Orders retrieved successfully', orders });
  } catch (error) {
    handleError('getAllOrders', res, error);
  }
};

const ORDER_NO_MAX = 2147483647;

/** Whole order numbers only. Anything else must not be compared to order_no. */
function parseWholeOrderNo(value) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/.test(text)) return null;
  const number = Number(text);
  if (!Number.isSafeInteger(number) || number > ORDER_NO_MAX) return null;
  return number;
}

export const getOrderReport = async (req, res) => {
  const { collection_id, order_type } = req.params;
  const { fromBillNo, toBillNo } = req.query;
  try {
    let billsQuery = `
      select order_no, name, total_firki from orders where collection_id = $1 AND order_type = $2
    `;
    let billsParams = [collection_id, order_type];
    const fromText = String(fromBillNo ?? "").trim();
    const toText = String(toBillNo ?? "").trim();
    if (fromText || toText) {
      const fromNo = parseWholeOrderNo(fromText);
      const toNo = parseWholeOrderNo(toText);
      if (fromNo === null || toNo === null) {
        const error = new Error("Order numbers must be whole numbers.");
        error.statusCode = 400;
        error.code = "INVALID_ORDER_NUMBER";
        throw error;
      }
      billsQuery += ` AND order_no >= $3 AND order_no <= $4`;
      billsParams.push(fromNo, toNo);
    }
    const orders = await query(billsQuery, billsParams);
    res.status(200).json({ message: 'Orders retrieved successfully', orders });
  } catch (error) {
    handleError('getOrderReport', res, error);
  }
};

/*
-- Table: products
CREATE TABLE products (
    sr_no SERIAL PRIMARY KEY,
    product_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(collection_id),
    product_name VARCHAR(50) NOT NULL,
    wholesale_price FLOAT,
    retail_price FLOAT,
    stock_in_hand INT NOT NULL,
    total_stock INT NOT NULL,
    is_labour BOOLEAN DEFAULT FALSE,
    is_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ
);
*/

// CREATE TABLE bills (
// 	   sr_no SERIAL PRIMARY KEY,
//     order_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
//     collection_id UUID NOT NULL REFERENCES collections(collection_id),
//     order_no INT NOT NULL,
//     order_type VARCHAR(50) CHECK (order_type IN ('retail','wholesale')),
//     UNIQUE (collection_id, order_no, order_type),
//     mobile VARCHAR(20) NOT NULL,
//     name VARCHAR(100) NOT NULL,
//     address VARCHAR(500) NOT NULL,
//     order_date TIMESTAMPTZ NOT NULL,
//     delivery_date TIMESTAMPTZ NOT NULL,
//     notes TEXT,
//     total_firki INT NOT NULL,
//     sub_total FLOAT NOT NULL,
//     discount FLOAT NOT NULL,
//     advance FLOAT NOT NULL,
//     total_due FLOAT NOT NULL
// );

// CREATE TABLE order_items (
// 	   sr_no SERIAL PRIMARY KEY,
//     order_item_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
//     order_id UUID NOT NULL REFERENCES bills(order_id),
//     product_id UUID NOT NULL REFERENCES products(product_id),
//     quantity INT NOT NULL,
//     price FLOAT NOT NULL,
//     UNIQUE (order_id , product_id)
// );
export const getWholeSaleOrdersByMobile = async (req, res) => {
  const { mobile, collection_id } = req.params;
  console.log({ mobile, collection_id });
  try {
    const client = (await getClientByMobileWithLocation(mobile)) ?? {};
    // SQL query to fetch bills with their items and product names
    const orders = await query(`
      SELECT 
        o.*, 
        json_agg(json_build_object('quantity', bi.quantity, 'price', bi.price, 'product_name', p.product_name, 'product_id', p.product_id)) AS order_items
      FROM orders o
      LEFT JOIN order_items bi ON o.order_id = bi.order_id
      LEFT JOIN products p ON bi.product_id = p.product_id
      WHERE o.mobile = $1 AND o.collection_id = $2 AND o.order_type = 'wholesale'
      GROUP BY o.order_id, o.sr_no
    `, [mobile, collection_id]);

    res.status(200).json({ orders, ...client });
  } catch (error) {
    handleError('getAllOrdersByClientMobile', res, error);
  }
};

export const getWholesaleOrdersCsvReport = async (req, res) => {
  const { collection_id } = req.params;
  try {
    const wholesale_orders = await query(`
      SELECT *
      FROM orders
      WHERE collection_id = $1 AND order_type = 'wholesale'
    `, [collection_id]);

    res.status(200).json({ message: 'Orders retrieved successfully', wholesale_orders });
  } catch (error) {
    handleError('getWholesaleOrdersCsvReport', res, error);
  }
};