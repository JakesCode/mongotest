const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String
    },
    user: {
        type: String
    }
})

module.exports = mongoose.model("RefreshToken", refreshTokenSchema, "refresh_tokens");