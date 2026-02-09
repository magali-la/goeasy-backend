// DEPENDENCIES
require("dotenv").config();
const express = require("express");
const app = express();

// passport dependencies
const passport = require("passport");
require("./config/passport.js");

// DATABASE CONNECTION
const db = require("./config/connection.js");

// MIDDLEWARE
// parse JSON data
app.use(express.json());

// initilize pssport
app.use(passport.initialize());

// ROUTES - pass all requests to this central routing hub
const router = require("./routes/index.js");
app.use(router);

// LISTENER PORT
// fallback for port
const PORT = process.env.PORT || 4001;

// wait for mongodb connection before starting the server
db.once("open", () => {
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
});