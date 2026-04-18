import path from 'path';
import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/authMiddleware.js';
import { uploadCourseCertificate, getCourseCertificate } from '../controllers/userController.js';

const router = express.Router();

// Configure multer for file storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in the 'uploads' folder
  },
  filename(req, file, cb) {
    // Create a unique filename to avoid conflicts
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
const certificateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const handleCertificateUpload = (req, res, next) => {
  certificateUpload.single('file')(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size must be 5MB or less' });
    }

    return res.status(400).json({ message: error.message || 'File upload failed' });
  });
};

router.post('/profile', protect, upload.single('file'), (req, res) => {
  res.send({
    message: 'Profile image uploaded successfully',
    path: `/${req.file.path.replace(/\\/g, '/')}`,
  });
});

// Define the upload route
router.post('/', protect, admin, upload.single('file'), (req, res) => {
  // When a file is uploaded, multer adds a 'file' object to the request.
  // We send back the path where the file was saved.
  res.send({
    message: 'File uploaded successfully',
    path: `/${req.file.path.replace(/\\/g, "/")}`, // Format path for web
  });
});

// Certificate upload/view fallback routes.
router.post('/certificate', protect, handleCertificateUpload, uploadCourseCertificate);
router.get('/certificate/:courseId', protect, getCourseCertificate);

export default router;