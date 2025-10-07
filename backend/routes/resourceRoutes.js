// backend/routes/resourceRoutes.js
import express from 'express';
import { getResources, createResource, deleteResource } from '../controllers/resourceController.js';
import { protect, admin } from '../middleware/authMiddleware.js';


const router = express.Router();

router.route('/')
  .get(protect, getResources) // Students can get resources
  .post(protect, admin, createResource); // Only admins can create

router.route('/:id')
  .delete(protect, admin, deleteResource); // Only admins can delete

export default router;