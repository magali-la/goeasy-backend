const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User.js");

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},

    // function to verify if there's a user or not
    async (accessToken, refreshToken, profile, cb) => {
        try {
            // find user by the google profile id in the database from when an OAuth user signs up
            let user = await User.findOne({ googleId: profile.id });

            // fallback for new user not in db
            if (!user) {
                user = await User.create({
                    // trim email to make username
                    username: profile.emails[0].value.split("@")[0],
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    provider: "google"
                });
            }

            // when the user is created or authenticated, passport will set this as the req.user
            return cb(null, user);
        } catch (error) {
            // stop login process if there's an error
            return cb(error);
        }
    }
));