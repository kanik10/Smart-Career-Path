// backend/routes/userManagementRoutes.js

import express from 'express';
import { 
    getUsers, 
    updateUserStatus, 
    resetUserPassword 
} from '../controllers/userManagementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(admin);

router.route('/users')
    .get(getUsers);

router.route('/users/:id/status')
    .patch(updateUserStatus);

router.route('/users/:id/reset-password')
    .post(resetUserPassword);

export default router;