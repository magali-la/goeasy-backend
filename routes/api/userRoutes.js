const router = require("express").Router();
const User = require("../../models/User.js");
// sanitize user utility
const { sanitizeUser } = require("../../utils/sanitizeUser.js");

// use the signToken utility to assign a token to the user on signup and login
const { authMiddleware, signToken } = require("../../utils/auth.js");

// ROUTES 
// CREATE new user - POST /api/user/register
router.post("/register", async (req, res) => {
    try {
        // create a new user
        const user = await User.create(req.body);

        // create the token for the response body
        const token = signToken(user);

        // remove password from the response - convert the Mongoose document with metadata into an object
        const userObj = sanitizeUser(user);

        // success response w token and user
        res.status(201).json({ token, user: userObj });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// LOGIN - POST /api/users/login
router.post("/login", async (req, res) => {
    try {
        // bad request error if email or password are missing
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // since defult behavior removes password from query, select it for bcrypt comparison to work
        const user = await User.findOne({ email: req.body.email }).select("+password");

        // user not found by email
        if (!user) {
            return res.status(400).json({ message: "Incorrect email or password."});
        }

        // check if correct password
        const correctPw = await user.isCorrectPassword(req.body.password);

        if (!correctPw) {
            return res.status(400).json({ message: "Incorrect email or password." });
        }

        // assign token to user
        const token = signToken(user);

        // sanitize user utility - remove sensitive data
        const userObj = sanitizeUser(user);

        // response with user
        res.json({ token, user: userObj });

    } catch (error) {
        // if the bad request errors above aren't caught, then it's a server error
        res.status(500).json({ message: error.message });
    }
});

// INDEX - get profile - GET /api/users/me
router.get("/me", authMiddleware, async (req, res) => {
    // authMiddleware is going to attach a req.user if the token is valid and then run this route to return the profile
    try {
        // find the user - it will never query with password or google id bc of schema select: false for both fields
        const user = await User.findById(req.user._id);

        // user without pass/googleid
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;