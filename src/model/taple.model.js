const mongo = require('mongoose');

const tapleSchema = new mongo.Schema({
    tableNumber: {
        type: Number,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ["available", "occupied", "reserved"],
        default: "available"
    },
    OrderId: {
        type: mongo.Schema.Types.ObjectId,
        ref: "order",   
    }
}, {
    timestamps: true
});

const taple = mongo.model("taple", tapleSchema);
module.exports = taple;