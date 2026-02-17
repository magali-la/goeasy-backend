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

        // then populate to get the full participant objects and activitites object with full data for the frontend in the response
        await trip.populate("participants")
        await trip.populate({
            path: "activities.activityId"
        });

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

// ROUTES FOR ACTIVITIES - INDUCES

// CREATE - add an activity to a trip - POST /api/trips/:tripId/activities
router.post("/:tripId/activities", async (req, res) =>{
    const tripId = req.params.tripId;
    // add the activity id and the array of participants for this activitythat's being passed from the frontend
    const {activityId, participants} = req.body;

    // stop the route if the participants weren't sent from the frontend - needs this array to make sure the activity gets added to each user's document from the participants
    if (!participants || participants.length === 0) {
        return res.status(400).json({ message: "Participants array required"})
    }

    try {
        // get the trip in question
        const trip = await Trip.findById(tripId);

        if (!trip) {
			return res.status(404).json({ message: "No trip found with this id" });
		}

        // are they authorized to do this?
        if (!trip.participants.includes(req.user._id)) {
            return res.status(403).json({ message: "Not authorized to add activities to this trip" });
        }

        // check if this activityId being requested to be added is already in this activities - check the activityId nested field against the activityId in the req.body
        const alreadyAdded = trip.activities.find(activity => activity.activityId.toString() === activityId);

        if (alreadyAdded) {
            return res.status(400).json({ message: "Activity already added" });
        };
        
        // add with the participants of the req.body, or if it's not included, then the trip.participants array by default
        trip.activities.push({
            activityId: activityId,
            participants: participants || trip.participants
        });

        // save it since directly manipulating the trip to push the object
        await trip.save();

        // for loop through each of the users in trip.participants - add the activity to each user's document
        for (let userId of participants) {
            // get the user, go to the activities array
            const user = await User.findById(userId);

            // go to user.activities array of objects. check in each object if there tripId key's value is the same as the tripId of the trip they have dded it to
            let userTripActivity = user.activities.find(activityObj => activityObj.tripId.toString() === tripId)
        
            // if there isn't a match - then go to user's document and add the fields in an object if it doesn't exist in the user.activities array
            if (!userTripActivity) {
                await User.findByIdAndUpdate(
                    userId,
                    { $push: { activities: { 
                        tripId: tripId, 
                        activityIds: [activityId] 
                    }}}
                );
            } else {
                // Add to existing activityIds array - the elem is a placeholder which tells it to specifically add to the element (the object) of the user.activities array which  matches the arrayFilters. the element where the tripId = the tripId in question
                await User.findByIdAndUpdate(
                    userId,
                    { $push: { "activities.$[elem].activityIds": activityId } },
                    { arrayFilters: [{ "elem.tripId": tripId }] }
                );
            }
        }
        
        // return the trip - don't need to populate in the response - frontend will refresh the get trip by id route which should populate everything to store in state
        res.json(trip);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;