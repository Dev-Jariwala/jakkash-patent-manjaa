import express from 'express';
import * as clientControllers from '../controllers/clients.js';

const router = express.Router();

router.get("/", clientControllers.getClients);
router.get("/all", clientControllers.getAllClients);
router.get("/:mobile", clientControllers.getClientByMobileNumber);

export default router;
