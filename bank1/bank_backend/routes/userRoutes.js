const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadPhoto, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Configure multer storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 }, // 5MB limit
  fileFilter(req, file, cb) {
    const filetypes = /jpe?g|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Images only (jpeg, jpg, png, webp)'));
    }
  }
});

// Protected routes
router.use(protect);

router.post('/upload-photo', upload.single('photo'), uploadPhoto);
router.delete('/delete-account', deleteAccount);

module.exports = router;
