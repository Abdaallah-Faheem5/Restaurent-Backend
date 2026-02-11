const mongo = require('mongoose');

const DEFAULT_MENU_ITEM_IMAGE = 'https://imgs.search.brave.com/1b9-woh6-zSQXo-6kX17bRhjxn38_QrCu1bDYwJhdgs/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9zdGF0aWMudmVjdGVlenkuY29tL3N5c3RlbS9yZXNvdXJjZXMvdGh1bWJuYWlscy8wNDEvOTI2LzMxMy9zbWFsbC9haS1nZW5lcmF0ZWQtYS1jbG9zZS11cC1vZi1hLWRlbGljaW91cy1zdGVhbXktY2hpY2tlbi1zaGF3YXJtYS13cmFwLXdpdGgtZnJlc2gtdmVnZXRhYmxlcy1hbmQtc3BpY2VzLWZyZWUtcGhvdG8uanBlZw';

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
        default: ''
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        default: DEFAULT_MENU_ITEM_IMAGE
    }
}, {
    timestamps: true
});

const menuItem = mongo.model("menuItem", menuItemSchema);
module.exports = menuItem;
