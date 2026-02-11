const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller.js');
const { authenticate } = require('../middlewares/auth.middleware.js');


router.get('/me', authenticate, authController.getMe);

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authenticate, authController.logout);

router.put('/test/:id', authController.test);

module.exports = router;