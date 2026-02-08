const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    // username
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        minlength: 6,
        // set to 30 in case google email is long, cap at 15 in frontend for local signups
        maxlength: 30,
        // pattern match
        match: [/^[a-zA-Z0-9_-]+$/, 'Username must contain letters, number, dash -, or underscore _']
    },
    // email
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/.+@.+\..+/, "Must use a valid email address"]
    },
    // password
    password: {
        type: String,
        minlength: 8,
        required: [true, 'Password required'],
        match: [/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, "Password must be at least 8 characters long and contain at least one letter and one number"]
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;