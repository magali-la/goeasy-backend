const router = require("express").Router();
const Trip = require("../../models/Trip.js");
const User = require("../../models/User.js");

// Auth middleware
const { authMiddleware } = require("../../utils/auth.js");
router.use(authMiddleware);

// ROUTES FOR TRIPS - INDUCES
// INDEX all trips - GET /api/trips

// INDEX one trip - GET /api/trips/:tripId

// DELETE one trip - DELETE /api/trips/:tripId

// UPDATE one trip - PUT /api/trips/:tripId

// CREATE one trip - POST /api/trips
router.post("/", async (req, res) => {
    try {
        // take the req.body from the frontend form to create a trip
        const trip = await Trip.create(req.body);
        
        // for loop through the trip.participants array to add the trip id to each of those user's trips in their document. frontend sends an array of the participants with either just that user or more users if they've added one in the form before submitting
        for (let userId of trip.participants) {
            // find the user from the id stored in participants and update the trips field with an operator method to push in the array
            await User.findByIdAndUpdate(
                userId,
                { $push: { trips: trip._id } }
            );
        }
        
        // success response with trip
        res.status(201).json(trip);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ROUTES FOR PARTICIPANTS - INDUCES
// DELETE a trip participant - DELETE /api/trips/:tripId/participants/:userId

// CREATE add a trip participant - POST /api/trips/:tripId/participants


module.exports = router;