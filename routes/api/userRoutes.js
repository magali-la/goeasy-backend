const router = require("express").Router();
const User = require("../../models/User.js");
// sanitize user utility
const { sanitizeUser } = require("../../utils/sanitizeUser.js");

// use the signToken utility to assign a token to the user on signup and login
const { authMiddleware, signToken, setAuthCookie } = require("../../utils/auth.js");

// ROUTES 
// CREATE new user - POST /api/user/signup
router.post("/signup", async (req, res) => {
    try {
        // create a new user
        const user = await User.create(req.body);

        // create the token for the response body
        const token = signToken(user);

        // remove password from the response - convert the Mongoose document with metadata into an object
        const userObj = sanitizeUser(user);

        // call utility to create cookie response
        setAuthCookie(res, token)

        // success response w user
        res.status(201).json({ user: userObj });

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

        // call utility to create cookie response
        setAuthCookie(res, token)

        // response with user
        res.json({ token, user: userObj });

    } catch (error) {
        // if the bad request errors above aren't caught, then it's a server error
        res.status(500).json({ message: error.message });
    }
});

// LOGOUT - clear cookies - POST /api/users/logout
// use the same settings as setAuthCookie - updated for production
router.post("/logout", (req, res) => {
    res.clearCookie("authToken", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/"
    });

  res.status(200).json({ message: "Logged out successfully" });
});

// INDEX - get profile - GET /api/users/me
router.get("/me", authMiddleware, async (req, res) => {
    // authMiddleware is going to attach a req.user if the token is valid and then run this route to return the profile
    try {
        // find the user - it will never query with password or google id bc of schema select: false for both fields
        // this is going to populate data needed
        const user = await User.findById(req.user._id).populate("trips").populate({
            path: "activities.activityIds",
            model: "Activity"
        });

        // user without pass/googleid - with full objects for things in the schema for trips and activities
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE - delete account /api/users/me
router.delete("/me", authMiddleware, async (req, res) => {
    // auth middleware will return the req.user and run this route if the token is valid, find the user and delete them
    try {
        // store the user while deleting to use the provider field for conditional response - req.user only has user, email, id from middleware
        const user = await User.findByIdAndDelete(req.user._id);

        // extra check that a user exists in case the token is still active and passes middleware checks
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // additional info for google users
        if (user.provider === "google") {
            return res.status(200).json({ message: "Account deleted successfully. If you signed up with Google, remember to revoke access in your Google Account settings." })
        }

        // normal return for
        return res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ROUTES for user search for adding trip participants
// INDEX to find a user - GET /api/users/search
// frontend is going to have a query called username that will look like this : search?username=${searchTerm} so pull the query param to find the user by their id (this is needed so it can actually add the participant to the trip by their id in the backend)
router.get("/search", authMiddleware, async (req, res) => {
    try {
        // set the serchInput from the query param, which should be the username they're looking for
        const searchInput = req.query.username;

        // frontend will also have protections to stop user from making an empty search
        if (!searchInput) {
            return res.status(400).json({ message: "Username required" })
        }

        // find a match for anything that includes the search term and case insensitive option - it returns an array the frontend maps to show the results
        const users = await User.find({
            username: { $regex: searchInput, $options: "i" }
        });

        // return the array of matches the frontend will map on the search results component
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ROUTES for budget management for the user
// CREATE a new budget for a trip - POST /api/users/budgets
router.post("/budgets", authMiddleware, async (req, res) => {
    // destructure to get the tripId and amount send by the frontend
    const { tripId, amount } = req.body;

    try {
        // get the current user
        const user = await User.findById(req.user._id);

        // figure out if there is already a budget for the trip in question
        const existingBudget = user.budgets.find(budget => budget.tripId.toString() === tripId);

        // If there's already a budget set for this tripId, then update it with operators
        if (existingBudget) {
            await User.findByIdAndUpdate(
                req.user._id,
                { $set: { "budgets.$[elem].amount": amount } },
                { arrayFilters: [{ "elem.tripId": tripId }] }
            );
        } else {
            // otherwise push the object up from scratch into this array
            await User.findByIdAndUpdate(
                req.user._id,
                { $push: { budgets: { tripId, amount }} }
            )
        }

        // update user and populate the key info needed
        const updatedUser = await User.findById(req.user._id).populate("trips").populate({
            path: "activities.activityIds",
            model: "Activity"
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;