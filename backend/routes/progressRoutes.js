// backend/routes/progressRoutes.js
import express from 'express';
import { getProgressData, toggleMilestone } from '../controllers/progressController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/data').get(protect, getProgressData);
router.route('/milestones').put(protect, toggleMilestone);

export default router;