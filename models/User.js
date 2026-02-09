const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    // username
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        // set to 1 in case emails from OAuth users are short, in frontend set min to 6
        minlength: 1,
        // set to 30 in case google email is long, cap at 15 in frontend for local signups
        maxlength: 30,
        // pattern match
        match: [/^[a-zA-Z0-9._-]+$/, 'Username must contain letters, number, period ., dash -, or underscore _']
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
        match: [/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, "Password must be at least 8 characters long and contain at least one letter and one number"],
        // Google OAuth won't have password so validate this with the googleId if provided or just the password for local auth
        validate: {
            validator: function (password) {
                return this.googleId || password;
            }
        }
    },
    // add fields for OAuth
    googleId: {
        type: String,
        unique: true,
        // sparse to only look for users in collection that have this field in its document if searching for the google user
        sparse: true
    },
    provider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    }
// set timestamp for createdAt and updatedAt fields for user profile UI
}, { timestamps: true });

// BCRYPT
// hash passwords for local auth users, pre-save middleware
userSchema.pre('save', async function() {
    // hash the password if it's a new user or if password has been modified - check if there's a password first
    if (this.password && (this.isNew || this.isModified('password'))) {
        const saltRounds = 10;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }
});

// compare incoming password with hashed password for login
userSchema.methods.isCorrectPassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;