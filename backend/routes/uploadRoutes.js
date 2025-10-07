import path from 'path';
import express from 'express';
import multer from 'multer';

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

// Define the upload route
router.post('/', upload.single('file'), (req, res) => {
  // When a file is uploaded, multer adds a 'file' object to the request.
  // We send back the path where the file was saved.
  res.send({
    message: 'File uploaded successfully',
    path: `/${req.file.path.replace(/\\/g, "/")}`, // Format path for web
  });
});

export default router;