import express from 'express';
import * as ordersValidators from '../validators/orders.js';
import * as ordersControllers from '../controllers/orders.js';

const router = express.Router();

router.post("/:collection_id/orders", ordersValidators.validateCreateOrder, ordersControllers.createOrder);
router.get("/:collection_id/orders", ordersControllers.getOrders);
router.get('/:collection_id/orders-all', ordersControllers.getAllOrders);
router.get('/:collection_id/orders/next-order-no', ordersControllers.getNextOrderNo);
router.get('/:collection_id/orders/:order_id', ordersControllers.getOrderById);
router.get('/:collection_id/orders/:order_type/report', ordersControllers.getOrderReport);
router.get('/:collection_id/orders/wholesale-orders/csv-report', ordersControllers.getWholesaleOrdersCsvReport);
router.get('/:collection_id/orders/wholesale-orders/pdf-report/:mobile', ordersControllers.getWholeSaleOrdersByMobile);
router.put('/:collection_id/orders/:order_id', ordersValidators.validateUpdateOrderById, ordersControllers.updateOrderById);
router.patch('/:collection_id/orders/:order_id/delivered', ordersValidators.validateUpdateOrderDeliveryStatus, ordersControllers.updateOrderDeliveryStatus);
router.patch('/:collection_id/orders/:order_id/payment', ordersValidators.validateUpdateOrderPaymentStatus, ordersControllers.updateOrderPaymentStatus);
router.post('/:collection_id/orders/:order_id/whatsapp/resend', ordersValidators.validateResendOrderWhatsAppDelivery, ordersControllers.resendOrderWhatsAppDelivery);
router.post('/:collection_id/orders/:order_id/whatsapp/cancel', ordersValidators.validateForceCancelOrderWhatsAppDelivery, ordersControllers.forceCancelOrderWhatsAppDelivery);
export default router;
