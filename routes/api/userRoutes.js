const router = require("express").Router();
const User = require("../../models/User.js");

// ROUTES 
// CREATE new user - POST /api/user/register
router.post("/register", async (req, res) => {
    try {
        // create a new user
        const user = await User.create(req.body);

        // remove password from the response - convert the Mongoose document with metadata into an object
        const userObj = user.toObject();
        delete userObj.password;

        // success response
        res.status(201).json({ user: userObj });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;