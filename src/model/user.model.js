const mongo = require('mongoose');

const userSchema = new mongo.Schema({
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin", "waiter",],
        default: "user"
    },
}, {
    timestamps: true
});

const user = mongo.model("User", userSchema);
module.exports = user;
