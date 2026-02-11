const express = require('express');
const router = express.Router();
const multer = require('multer');
const menuController = require('../controller/menu.controller.js');
const { authenticate, authorize } = require('../middlewares/auth.middleware.js');

// Configure multer for image uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('ONLY_IMAGES_ALLOWED'));
    }
    cb(null, true);
  }
});

const handleImageUploadRequest = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Image size must be 10MB or less'
      });
    }

    if (error.message === 'ONLY_IMAGES_ALLOWED') {
      return res.status(400).json({
        success: false,
        message: 'Only image files are allowed'
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid image upload request'
    });
  });
};

router.get('/categories', menuController.getAllCategories);
router.get('/items', menuController.getAllMenuItems);
router.get('/items/:id', menuController.getMenuItemById);
router.get('/categories/:categoryId/items', menuController.getItemsByCategory);

router.post('/categories', authenticate, authorize('admin'), menuController.createCategory);
router.post('/items', authenticate, authorize('admin'), menuController.createMenuItem);
router.post('/upload-image', authenticate, authorize('admin'), handleImageUploadRequest, menuController.uploadImage);

router.put('/categories/:id', authenticate, authorize('admin'), menuController.updateCategory);
router.put('/items/:id', authenticate, authorize('admin'), menuController.updateMenuItem);

router.delete('/categories/:id', authenticate, authorize('admin'), menuController.deleteCategory);
router.delete('/items/:id', authenticate, authorize('admin'), menuController.deleteMenuItem);
module.exports = router;
