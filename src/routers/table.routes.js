const express = require('express');
const router = express.Router();
const tapleController = require('../controller/table.controller.js');
const { authenticate, authorize } = require('../middlewares/auth.middleware.js');


router.get('/', tapleController.getAllTables);
router.delete('/:id', authenticate, tapleController.dleteTable);
module.exports = router;