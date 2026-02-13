const router = require("express").Router();
const passport = require("passport");
const { signToken, setAuthCookie } = require('../../utils/auth.js');

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

        // send cookie to browser with token
        setAuthCookie(res, token);

        // redirect to home in frontend
        res.redirect(`${process.env.FRONTEND_ORIGIN}/home`);
    }
);

// redirect to a frontend login page
router.get("/failure", (req, res) => {
    res.status(302).redirect(`${process.env.FRONTEND_ORIGIN}/login`);
});

module.exports = router;