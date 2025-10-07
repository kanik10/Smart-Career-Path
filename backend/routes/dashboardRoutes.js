// backend/routes/dashboardRoutes.js

import express from 'express';
import { getDashboardData, getAdminDashboardStats } from '../controllers/dashboardController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Student dashboard route
router.route('/data').get(protect, getDashboardData);

// Admin dashboard route
router.route('/admin/stats').get(protect, admin, getAdminDashboardStats);

export default router;