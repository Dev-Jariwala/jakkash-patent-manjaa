import { handleError } from "../utils/error.js";
import {
  createBill,
  getBill,
  listBills,
  previewBillTotals,
  updateBill,
} from "../services/bill.js";
import { createBillDeps } from "../services/billStore.js";

export const listGstBills = async (req, res) => {
  const { collection_id } = req.params;
  try {
    const bills = await listBills(createBillDeps(), collection_id);
    res.status(200).json({ bills });
  } catch (error) {
    handleError("listGstBills", res, error);
  }
};

export const getGstBill = async (req, res) => {
  const { collection_id, bill_id } = req.params;
  try {
    const bill = await getBill(createBillDeps(), collection_id, bill_id);
    res.status(200).json({ bill });
  } catch (error) {
    handleError("getGstBill", res, error);
  }
};

export const createGstBill = async (req, res) => {
  const { collection_id } = req.params;
  try {
    const bill = await createBill(createBillDeps(), collection_id, req.body);
    res.status(201).json({ bill });
  } catch (error) {
    handleError("createGstBill", res, error);
  }
};

export const updateGstBill = async (req, res) => {
  const { collection_id, bill_id } = req.params;
  try {
    const bill = await updateBill(createBillDeps(), collection_id, bill_id, req.body);
    res.status(200).json({ bill });
  } catch (error) {
    handleError("updateGstBill", res, error);
  }
};

export const previewGstBillTotals = async (req, res) => {
  try {
    const totals = previewBillTotals(req.body);
    res.status(200).json({ totals });
  } catch (error) {
    handleError("previewGstBillTotals", res, error);
  }
};
