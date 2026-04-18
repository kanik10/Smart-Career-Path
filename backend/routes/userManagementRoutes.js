// backend/routes/userManagementRoutes.js

import express from 'express';
import { 
  getUsers, 
  updateUserStatus, 
  resetUserPassword,
  updateUserCareerPathByAdmin, // 1. Import new function
  getStudentProgressList
} from '../controllers/userManagementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply admin auth middleware to all routes in this file
router.use(protect, admin);

router.route('/').get(getUsers);
router.route('/student-progress').get(getStudentProgressList);
router.route('/:id/status').patch(updateUserStatus);
router.route('/:id/reset-password').post(resetUserPassword);
router.route('/:id/career-path').put(updateUserCareerPathByAdmin); // 2. Add new route

export default router;