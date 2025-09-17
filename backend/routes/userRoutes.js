import express from 'express';
import {
  registerUser,
  loginUser,
  updateUserCareerPath,
  getUserProfile // Import the new controller
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import the middleware

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/career-path', updateUserCareerPath);

// Add the new protected route for getting the user profile
router.route('/profile').get(protect, getUserProfile);

export default router;