// DEPENDENCIES
require("dotenv").config();
const express = require("express");
const app = express();

// DATABASE CONNECTION
const db = require("./config/connection.js");

// LISTENER PORT
// fallback for port
const PORT = process.env.PORT || 4001;

// wait for mongodb connection before starting the server
db.once("open", () => {
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
});