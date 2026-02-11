const mongo = require('mongoose');

const categoriySchema = new mongo.Schema({
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
    displayOrder: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

const categoriy = mongo.model("categoriy", categoriySchema);
module.exports = categoriy;