const router = require("express").Router();
const passport = require("passport");
const { signToken } = require('../../utils/auth.js');

// Google OAuth routes and callback route

// redirect user to the Google login page
router.get("/",
    passport.authenticate("google", {
        scope: ["email"],
        // set session to false for pure JWT authentication and authorization
        session: false
    })
);

// Handles how Google responses after the login or approval for access - generate JWT or redirect to failure route
router.get("/callback", 
    passport.authenticate("google", {
        // temporary redirect route for backend only
        failureRedirect: "/failure",
        // set session to false for pure JWT authentication and authorization
        session: false  
    }),

    function(req, res) {
        // Successful authentication, assign the token
        const token = signToken(req.user);

        // convert mongoose document to plain object to remove the googleid field
        const userObj = req.user.toObject();
        delete userObj.googleId;

        // respond with the token and the user
        res.json({ token, user: userObj });
    }
);

// TODO: temp failure redirect route which just sends json data instead of redirecting to a frontend login
router.get("/failure", (req, res) => {
    res.status(401).json({ message: "OAuth login failed"});
});

module.exports = router;