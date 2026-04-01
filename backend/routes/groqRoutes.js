import express from 'express';
import chatWithGroq from '../controllers/groqController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, chatWithGroq);

export default router;
