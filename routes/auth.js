const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Schemas //
const User = require("../model/User");
const RefreshToken = require("../model/RefreshToken");
const AccessToken = require("../model/AccessToken");
const {registerValidation, loginValidation} = require("../validation");

router.post("/register", async (req, res) => {
    // Validate the data before saving the user //
    const {error} = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Checking if user already exists //
    // Since 'User' is defined as being in the 'accounts' collection, we can perform CRUD operations //
    const emailExists = await User.findOne({email: req.body.email}); // Bind data to the schema and then send findOne request //
    if(emailExists) return res.status(400).send("Email already exists");

    // Hash the password //
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new user //
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });
    try {
        const savedUser = await user.save(); // Saves to MongoDB //
        res.send({user: savedUser._id});
    } catch(err) {
        res.sendStatus(400).send(err);
    }
});

router.post("/login", async (req, res) => {
    // Validate the data before checking the user //
    const {error} = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // Check for a user //
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(404).send("User not found");
    
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send("Incorrect password");

    // Create and assign a JWT //
    const token = jwt.sign({_id: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15s"});
    const refreshTokenSigned = jwt.sign({_id: user._id}, process.env.REFRESH_TOKEN_SECRET); // Make a refresh token that doesn't expire, and save it in the database //

    // Now we need to save the tokens to MongoDB so we can delete them when a user logs out //
    const accessToken = new AccessToken({
        token: token,
        user: user._id
    });
    await accessToken.save();
    const refreshToken = new RefreshToken({
        token: refreshTokenSigned,
        user: user._id
    });
    await refreshToken.save();

    res.header("auth-token", token).header("refresh-token", refreshTokenSigned).send({access_token: token, refresh_token: refreshTokenSigned});
});

router.post("/token", async (req, res) => {
    // A user will hit this endpoint when their access token expires and they send a valid refresh token //
    // The token originally supplied to them will have contained their user_id so we can use this to get the user back if it's a valid request //
    const token = req.header("refresh-token");
    if(!token) return res.status(401).send("Access Denied!");
    try {
        const refreshTokenContent = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const refreshToken = await RefreshToken.findOne({user: refreshTokenContent._id}); // Find the token in the database //
        if(!refreshToken) return res.status(404).send("Can't find that refresh-token");
        const user = jwt.verify(refreshToken.token, process.env.REFRESH_TOKEN_SECRET);
        if(!user) return res.status(400).send("Couldn't get the user out of the token");
        if(user._id === refreshTokenContent._id) {
            // // All good, issue a new access token //
            await AccessToken.deleteMany({user: user._id}); // Delete any previous tokens in the database //
            const newAccessToken = jwt.sign({_id: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "15s"});
            const accessToken = new AccessToken({
                token: newAccessToken,
                user: user._id
            });
            await accessToken.save();
            res.status(201).send({access_token: newAccessToken});
        } else {
            res.status(400).send("User in token does not match supplied user_id");
        }
    } catch(err) {
        console.dir("error");
        res.status(500).send(err);
    }
});

router.post("/logout", async (req, res) => {
    // A user will hit this endpoint when they log out. It will need to delete any refresh tokens that have been assigned to them //
    // Their current refresh token will be supplied with this request, as it authenticates them as that user //
    const token = req.header("refresh-token");
    if(!token) return res.status(401).send("Access Denied!");
    try {
        const refreshTokenContent = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        const refreshResult = await RefreshToken.deleteMany({user: refreshTokenContent._id}); // Find the refresh token(s) in the database //
        const accessResult = await AccessToken.deleteMany({user: refreshTokenContent._id}); // Find the access token(s) in the database //
        if(refreshResult.deletedCount + accessResult.deletedCount > 0) {
            res.status(200).send("Logged out successfully!");
        } else {
            res.status(404).send("Could not find any refresh or access tokens for this user.");
        }
    } catch(err) {
        console.dir("error");
        res.status(500).send(err);
    }
})

module.exports = router;