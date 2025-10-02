import express from 'express';
import {
  registerUser,
  loginUser,
  updateUserCareerPath,
  getUserProfile,
  updateUserProfile,
  createAdminUser // This import will now work
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/career-path', updateUserCareerPath);

// --- ADD THIS NEW ROUTE ---
// Note: In a real app, you would protect this route so only other admins can create admins
router.post('/admin', createAdminUser);


router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;