import express from 'express';
import { getAnalytics, getTotalCounts } from '../controllers/analytics.js';

const router = express.Router();

router.get("/:collection_id/analytics", getAnalytics);
router.get("/:collection_id/counts", getTotalCounts);

export default router;
