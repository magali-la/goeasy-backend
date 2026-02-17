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
router.delete("/:tripId", async (req, res) => {
	const tripId = req.params.tripId;

    try {
        const trip = await Trip.findById(tripId);

        // error if no trip
        if (!trip) {
          return res.status(404).json({ message: "No trip found with this id" });
        };

		// check authorization
		if (!trip.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized to view this trip" });
        };

        // for loop - need to delete this trip from all the user's who had this trip id in their trips field before deleting it
        for (let userId of trip.participants) {
            // mongoose operator to delete something from an array
            await User.findByIdAndUpdate(
                userId,
                { $pull: { trips: tripId } }
            )
        };

		await Trip.findByIdAndDelete(tripId);

        res.json({ message: "Trip deleted", deletedTrip: trip });
    } catch (error) {
      	res.status(500).json({ message: error.message });
    }
}); 

// UPDATE one trip - PUT /api/trips/:tripId
router.put("/:tripId", async (req, res) => {
	const tripId = req.params.tripId;

	try {
		// find the trip first then run authorization
		const trip = await Trip.findById(tripId);
		// error if no bookmark found
		if (!trip) {
			return res.status(404).json({ message: "No trip found with this id" });
		}

		// check if they're a participant
		if (!trip.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized to update this trip" });
        }

		// object.assign to overwrite anything from the request body that has changed from the original
		Object.assign(trip, req.body);
		// then save the trip
		await trip.save();

        // populate to get full participant data for the frontend
        await trip.populate("participants");

		// respond with the new trip
		res.json(trip);
	} catch (error) {
      	res.status(500).json({ message: error.message });
	}
});

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
router.delete("/:tripId/participants/:userId", async (req, res) => {
    // get the trip and user injected by frntend from the params
    const tripId = req.params.tripId;
    const userId = req.params.userId;

    try {
        // get the trip
        let trip = await Trip.findById(tripId);

        // if the trip doesn't exist
        if (!trip) {
			return res.status(404).json({ message: "No trip found with this id" });
		}

        // are they authorized to do this
        if (!trip.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized to delete participants from this trip" });
        }

        // delete the user from the trip's participants array - use operator to delete it from array
        trip = await Trip.findByIdAndUpdate(
            tripId,
            { $pull: { participants: userId }},
            // use this so that moongoose returns the updated trip instead of the old one since mongoose will default to returning the doc before the update
            { new: true }
        );

        // find that user and delete it from their document's trips array
        await User.findByIdAndUpdate(
            userId,
            { $pull: { trips: tripId } }
        );

        // populate the trip with the participants full data
        await trip.populate("participants");

        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE add a trip participant - POST /api/trips/:tripId/participants
router.post("/:tripId/participants", async (req, res) => {
    const tripId = req.params.tripId;
    // get the userId sent from the frontend
    const userId = req.body.userId

    try {
        // find the trip in question
        const trip = await Trip.findById(tripId);

        // if the trip doesn't exist
        if (!trip) {
			return res.status(404).json({ message: "No trip found with this id" });
		}

        // are they authorized to do this
        if (!trip.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized to add participants to this trip" });
        }

        // check if the user they want to add is already in the trip
        if (trip.participants.includes(userId)) {
            return res.status(400).json({ message: "User is already a participant" });
        }

        // then add them to the participants field in the trip and save the updates
        trip.participants.push(userId);
        await trip.save();

        // now add the trip to the new user's trips array - push into that array
        await User.findByIdAndUpdate(
            userId,
            { $push: { trips: tripId } }
        );

        // now return the trip and populate the full participants data
        await trip.populate("participants");

        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;