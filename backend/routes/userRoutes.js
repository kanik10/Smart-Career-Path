import express from 'express';
import multer from 'multer';
import {
  registerUser,
  loginUser,
  requestAdminOtp,
  resendAdminOtp,
  verifyAdminOtp,
  updateUserCareerPath,
  updateUserSubDomain,
  getUserProfile,
  updateUserProfile,
  createAdminUser,
  uploadCourseCertificate,
  getCourseCertificate,
  // --- ADD THESE MISSING IMPORTS ---
  enrollInCourse,
  dropCourse,
  completeCourse
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const handleCertificateUpload = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size must be 5MB or less' });
    }

    return res.status(400).json({ message: error.message || 'File upload failed' });
  });
};

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin/login/request-otp', requestAdminOtp);
router.post('/admin/login/resend-otp', resendAdminOtp);
router.post('/admin/login/verify-otp', verifyAdminOtp);
router.post('/admin', createAdminUser);

// Protected student routes
router.put('/career-path', protect, updateUserCareerPath); // Note: This should be a protected route
router.put('/subdomain', protect, updateUserSubDomain);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Protected course management routes
router.post('/courses/enroll', protect, enrollInCourse);
router.delete('/courses/drop/:id', protect, dropCourse);
router.post('/courses/complete', protect, completeCourse);
router.post('/courses/certificate', protect, handleCertificateUpload, uploadCourseCertificate);
router.get('/courses/certificate/:courseId', protect, getCourseCertificate);


export default router;