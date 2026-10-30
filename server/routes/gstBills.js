import express from "express";
import * as gstBillsControllers from "../controllers/gstBills.js";

const router = express.Router();

router.get("/:collection_id/gst-bills", gstBillsControllers.listGstBills);
router.post("/:collection_id/gst-bills/preview-totals", gstBillsControllers.previewGstBillTotals);
router.post("/:collection_id/gst-bills/export", gstBillsControllers.exportGstBills);
router.post("/:collection_id/gst-bills", gstBillsControllers.createGstBill);
router.get("/:collection_id/gst-bills/:bill_id", gstBillsControllers.getGstBill);
router.put("/:collection_id/gst-bills/:bill_id", gstBillsControllers.updateGstBill);

export default router;
