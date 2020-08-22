const jwt = require("jsonwebtoken");
const AccessToken = require("../model/AccessToken");
const e = require("express");

module.exports = async function(req, res, next) {
    const token = req.header("auth-token");
    if(!token) return res.status(401).send("Access Denied!");
    try {
        const verifiedUser = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // User may have a valid access token, but is it one we're currently accepting? //
        const accessToken = await AccessToken.findOne({user: verifiedUser._id});
        if(!accessToken) return res.status(401).send("Access token not valid.");
            
        if(accessToken.user === verifiedUser._id) {
            // This access token is valid, for this user, and one that we are currently accepting //
            req.user = verifiedUser; // Set the user parameter in the variable to be the user object //
        } else {
            res.status(401).send("Access token not valid for this user.");
        }
        
        next(); // Continue with execution //
    } catch(err) {
        res.status(400).send("Invalid auth-token!");
    }
};