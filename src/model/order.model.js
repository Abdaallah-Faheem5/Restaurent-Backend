const mongo = require('mongoose');

const orderSchema = new mongo.Schema({
    tableId: {
        type: mongo.Schema.Types.ObjectId,
        ref: "taple",
        required: true
    },
    userId: {
        type: mongo.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    status: {
        type: String,
        enum: ["pending", "preparing", "served", "paid"],
        default: "pending"
    },
    nameEn: {
        type: String,
        required: true,
    },
    items: {
        type: [{
            menuItemId: {
                type: mongo.Schema.Types.ObjectId,
                ref: "menuItem",
            },
            quantity: {
                type: Number,
                required: true,
            },
            unitPrice: {
                type: Number,
                required: true,
            },
                totalPrice: {
                type: Number,
                required: true,
            }
        }],
        required: true
    }
}, {
    timestamps: true
});

const order = mongo.model("order", orderSchema);
module.exports = order;
