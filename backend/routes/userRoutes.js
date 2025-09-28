import express from 'express';
import {
  registerUser,
  loginUser,
  updateUserCareerPath,
  getUserProfile,
  updateUserProfile // 1. Import new controller
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/career-path', updateUserCareerPath);

// 2. Add the PUT method to the /profile route
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;