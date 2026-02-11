const Taple = require('../model/taple.model.js');
const Order = require('../model/order.model.js');
const MenuItem = require('../model/menuItem.model.js');

class OrderController {

    async getAllOrders(req, res) {
        try {
            const { status, tableId } = req.query;
            const role = String(req.user?.role || '').trim().toLowerCase();

            let filter = {};

            if (status) {
                filter.status = status;
            }


            if (tableId) {
                filter.tableId = tableId;
            }

            // Default to owner-only access unless role is admin/waiter
            if (!['admin', 'waiter'].includes(role)) {
                filter.userId = req.user.UserId;
            }

            const filteredOrders = await Order.find(filter).lean();

            res.json({
                success: true,
                count: filteredOrders.length,
                data: filteredOrders
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في جلب الطلبات',
                error: error.message
            });
        }
    }
    async getOrderById(req, res) {
        try {
            const orderId = req.params.id;
            const role = String(req.user?.role || '').trim().toLowerCase();

            let order = await Order.findById(orderId).lean();

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'الطلب غير موجود'
                });
            }

            // Default to owner-only access unless role is admin/waiter
            if (!['admin', 'waiter'].includes(role) && String(order.userId || '') !== String(req.user.UserId)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this order'
                });
            }
            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ',
                error: error.message
            });
        }
    }
    async createOrder(req, res) {
        try {
            const { tableId, items, notes } = req.body;

            if (!tableId || !items || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'رقم الطاولة والعناصر مطلوبة'
                });
            }


            const table = await Taple.findById(tableId);
            if (!table) {
                return res.status(404).json({
                    success: false,
                    message: 'الطاولة غير موجودة'
                });
            }


            if (table.status === 'occupied') {
                return res.status(400).json({
                    success: false,
                    message: 'الطاولة محجوزة حالياً'
                });
            }


            const orderItems = [];
            let totalAmount = 0;

            for (const item of items) {
                const menuItem = await MenuItem.findById(item.menuItemId);

                if (!menuItem) {
                    return res.status(404).json({
                        success: false,
                        message: `العنصر ${item.menuItemId} غير موجود`
                    });
                }



                const subtotal = menuItem.price * item.quantity;
                totalAmount += subtotal;

                orderItems.push({
                    menuItemId: menuItem._id,
                    quantity: item.quantity,
                    unitPrice: menuItem.price,
                    totalPrice: subtotal
                });
            }


            const newOrder = new Order({
                tableId,
                userId: req.user.UserId,
                nameEn: `Order-${Date.now()}`,
                status: 'pending',
                items: orderItems
            });

            await newOrder.save();


            table.status = 'occupied';
            table.currentOrderId = newOrder._id;
            await table.save();

            res.status(201).json({
                success: true,
                message: 'تم إنشاء الطلب بنجاح',
                data: newOrder
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في إنشاء الطلب',
                error: error.message
            });
        }
    }
    async updateOrderStatus(req, res) {
        try {
            const orderId = req.params.id;
            const { status } = req.body;

            const validStatuses = ['pending', 'preparing', 'served', 'paid'];

            if (!status || !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'حالة غير صالحة'
                });
            }

            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'الطلب غير موجود'
                });
            }

            if (req.user.role === 'waiter' && !['pending', 'served'].includes(status)) {
                return res.status(403).json({
                    success: false,
                    message: 'النادل يمكنه فقط تحديث الحالة لـ "معلق" أو "تم التقديم"'
                });
            }

            // Update order status
            order.status = status;
            await order.save();

            // Free the table when the order is delivered or paid
            if (status === 'served' || status === 'paid') {
                const table = await Taple.findById(order.tableId);
                if (table) {
                    table.status = 'available';
                    table.currentOrderId = null;
                    await table.save();
                }
            }

            res.json({
                success: true,
                message: 'تم تحديث حالة الطلب',
                data: order
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في التحديث',
                error: error.message
            });
        }
    }
    async cancelOrder(req, res) {
        try {
            const orderId = req.params.id;
            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'الطلب غير موجود'
                });
            }

            if (['preparing', 'served', 'paid'].includes(order.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'لا يمكن إلغاء الطلب في هذه المرحلة'
                });
            }

            await Order.findByIdAndDelete(orderId);

            const table = await Taple.findById(order.tableId);
            if (table) {
                table.status = 'available';
                table.currentOrderId = null;
                await table.save();
            }

            res.json({
                success: true,
                message: 'تم إلغاء الطلب'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ في الإلغاء',
                error: error.message
            });
        }
    }
}

module.exports = new OrderController();
