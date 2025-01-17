const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 120
    },
    email: {
        type: String,
        required: true,
        min: 5,
        max: 60
    },
    password: {
        type: String,
        required: true,
        min: 10,
        max: 255
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

// Export 'userSchema' as 'User' and let mongoose know it will reside in the 'accounts' collection //
module.exports = mongoose.model("User", userSchema, "accounts");