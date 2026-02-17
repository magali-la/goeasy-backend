const router = require("express").Router();
const Trip = require("../../models/Trip.js");
const User = require("../../models/User.js");

// Auth middleware
const { authMiddleware } = require("../../utils/auth.js");
router.use(authMiddleware);

// ROUTES FOR TRIPS - INDUCES
// INDEX all trips - GET /api/trips
router.get("/", async (req, res) => {
    try {
        // the user's trips are in the user schema as an array of trip Ids, use this with populate to get the actual trip objects for the frontend preview card
        const user = await User.findById(req.user._id).populate("trips");

        // respond with their trips -> the array with trip objects
        res.json(user.trips);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// SHOW one trip - GET /api/trips/:tripId
router.get('/:tripId', async (req, res) => {
    const tripId = req.params.tripId;

    try {
        // get the trip
        const trip = await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({ message: "No trip found with this id" });
        }

        // Check for authorization to view the trip if they're a participant
        if (!trip.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized to view this trip" });
        }

        // then populate to get the full participant objects with full data for the frontend in the response TODO: activities populate
        await trip.populate("participants");

        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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