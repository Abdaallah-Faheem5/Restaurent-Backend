const mongo = require('mongoose');

const menuItemSchema = new mongo.Schema({
    categoryId: {
        type: mongo.Schema.Types.ObjectId,
        ref: "category",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    nameEn: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const menuItem = mongo.model("menuItem", menuItemSchema);
module.exports = menuItem;