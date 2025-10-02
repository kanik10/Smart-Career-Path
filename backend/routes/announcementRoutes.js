import express from 'express';
const router = express.Router();
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  completeAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController.js';

// Public routes
router.get('/', getAnnouncements);

// Admin routes
router.post('/', protect, admin, createAnnouncement);
router.put('/:id', protect, admin, updateAnnouncement);
router.put('/:id/complete', protect, admin, completeAnnouncement);
router.delete('/:id', protect, admin, deleteAnnouncement);

export default router;