// backend/routes/adminRoutes.js
import express from 'express';
import { getDashboardData } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/stats').get(protect, admin, getDashboardData);

export default router;