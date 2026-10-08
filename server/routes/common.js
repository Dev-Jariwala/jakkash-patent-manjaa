import express from "express";
import * as commonControllers from "../controllers/common.js";

const router = express.Router();

router.get("/countries", commonControllers.getCountries);
router.get("/states", commonControllers.getStates);
router.get("/cities", commonControllers.getCities);

export default router;
