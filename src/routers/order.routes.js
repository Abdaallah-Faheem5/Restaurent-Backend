const express = require('express');
const router = express.Router();
const orderController = require('../controller/order.controller.js');
const { authenticate, authorize } = require('../middlewares/auth.middleware.js');

router.use(authenticate);

router.get('/',  orderController.getAllOrders);
router.get('/:id',  orderController.getOrderById);

router.post('/', orderController.createOrder);

router.put('/:id/status', authorize('admin', 'waiter'), orderController.updateOrderStatus);

router.delete('/:id', authorize('admin',"waiter"), orderController.cancelOrder);

module.exports = router;
