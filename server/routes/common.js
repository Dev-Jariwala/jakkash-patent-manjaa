import express from "express";
import * as commonControllers from "../controllers/common.js";

const router = express.Router();

router.get("/countries", commonControllers.getCountries);
router.get("/states", commonControllers.getStates);
router.get("/cities", commonControllers.getCities);
router.get("/masters/countries", commonControllers.getMastersCountries);
router.get("/masters/states", commonControllers.getMastersStates);
router.get("/masters/cities", commonControllers.getMastersCities);
router.get("/masters/tax-codes", commonControllers.getMastersTaxCodes);
router.post("/masters/tax-codes", commonControllers.createMastersTaxCode);
router.put("/masters/tax-codes/:tax_code_id", commonControllers.updateMastersTaxCode);
router.get("/shop-bank-account", commonControllers.getShopBankAccountHandler);
router.put("/shop-bank-account", commonControllers.saveShopBankAccountHandler);

export default router;
