const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Import Routes //
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");

// Load environment variables //
dotenv.config();

// Connect to MongoDB //
mongoose.connect(
    process.env.MONGODB_CONNECTION_STRING,
    { useUnifiedTopology: true, useNewUrlParser: true },
    () => console.log("Connected to MongoDB successfully!")
);

// Middleware //
app.use(express.json()); // Allows us to use JSON //
app.use("/api/user", authRoute); // Route any requests on the /api/user/ prefix to our authRoute routes //
app.use("/api/posts", postRoute);

app.listen(5000, () => console.log("Server running!"));