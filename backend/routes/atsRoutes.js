import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { checkATS } from '../controllers/atsController.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }

    cb(new Error('Only PDF files are allowed'));
  },
});

const uploadFields = upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescriptionFile', maxCount: 1 },
]);

router.post('/check', protect, (req, res, next) => {
  uploadFields(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'Each PDF file must be 5MB or smaller.' });
      return;
    }

    res.status(400).json({ message: error.message || 'File upload failed.' });
  });
}, checkATS);

export default router;
