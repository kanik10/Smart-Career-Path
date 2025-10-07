import express from 'express';
import {
  registerUser,
  loginUser,
  updateUserCareerPath,
  getUserProfile,
  updateUserProfile,
  createAdminUser,
  // --- ADD THESE MISSING IMPORTS ---
  enrollInCourse,
  dropCourse,
  completeCourse
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin', createAdminUser);

// Protected student routes
router.put('/career-path', protect, updateUserCareerPath); // Note: This should be a protected route
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Protected course management routes
router.post('/courses/enroll', protect, enrollInCourse);
router.delete('/courses/drop/:id', protect, dropCourse);
router.post('/courses/complete', protect, completeCourse);


export default router;