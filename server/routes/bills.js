import express from 'express';
import * as billsValidators from '../validators/bills.js';
import * as billsControllers from '../controllers/bills.js';

const router = express.Router();

router.post("/:collection_id/bills", billsValidators.validateCreateBill, billsControllers.createBill);
router.get("/:collection_id/bills", billsControllers.getBills);
router.get('/:collection_id/bills-all', billsControllers.getAllBills);
router.get('/:collection_id/bills/next-bill-no', billsControllers.getNextBillNo);
router.get('/:collection_id/bills/:bill_id', billsControllers.getBillById);
router.get('/:collection_id/bills/:bill_type/report', billsControllers.getBillReport);
router.get('/:collection_id/:mobile/wholesale-bills', billsControllers.getWholeSaleBillsByMobile);
router.put('/:collection_id/bills/:bill_id', billsValidators.validateUpdateBillById, billsControllers.updateBillById);
export default router;
