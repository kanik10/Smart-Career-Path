import express from 'express';
import { registerUser, loginUser, updateUserCareerPath } from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/career-path', updateUserCareerPath); // Route to save career path

export default router;