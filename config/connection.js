// Dependencies
const mongoose = require("mongoose");

// DATABASE CONNECTION
// connect to the db
mongoose.connect(process.env.MONGO_URI);

// set the db
const db = mongoose.connection;

// set error and success messages for connection in console
db.on('error', (err) => console.log(err.message + ' is Mongo not running?'));
db.on('connected', () => console.log('Mongo connected'));
db.on('disconnected', () => console.log('Mongo disconnected'));

module.exports = mongoose.connection;
