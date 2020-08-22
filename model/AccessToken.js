const mongoose = require("mongoose");

const accessTokenSchema = new mongoose.Schema({
    token: {
        type: String
    },
    user: {
        type: String
    }
})

module.exports = mongoose.model("AccessToken", accessTokenSchema, "access_tokens");