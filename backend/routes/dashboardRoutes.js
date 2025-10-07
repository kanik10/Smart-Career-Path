// backend/routes/dashboardRoutes.js

import express from 'express';
import { getDashboardData } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// This defines the '/data' part of the URL
router.route('/data').get(protect, getDashboardData);

export default router;