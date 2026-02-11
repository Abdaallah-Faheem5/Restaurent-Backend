const Taple = require('../model/taple.model.js');
const Order = require('../model/order.model.js');

class tableController {
    async getAllTables(req, res) {
        try {
            const { status } = req.query;


            const filter = status ? { status } : {};


            const tables = await Taple.find(filter).lean();


            const tablesWithOrders = await Promise.all(
                tables.map(async (table) => {
                    if (table.currentOrderId) {
                        const order = await Order.findById(table.currentOrderId).lean();
                        return { ...table, currentOrder: order || null };
                    }
                    return table;
                })
            );

            res.json({
                success: true,
                count: tablesWithOrders.length,
                data: tablesWithOrders
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ',
                error: error.message
            });
        }
    }
    async dleteTable(req, res) {
        try {
            const tableId = req.params.id;
            const deletedTable = await Taple.findByIdAndDelete(tableId).lean();

            if (!deletedTable) {
                return res.status(404).json({
                    success: false,
                    message: 'الطاولة غير موجودة'
                });
            }
            res.json({
                success: true,
                message: 'تم حذف الطاولة بنجاح',
                data: deletedTable
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'حدث خطأ أثناء حذف الطاولة',
                error: error.message
            });
        }

}
}

module.exports = new tableController();