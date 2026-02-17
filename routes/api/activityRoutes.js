const router = require("express").Router();
const Activity = require("../../models/Activity.js");
const { authMiddleware } = require("../../utils/auth.js");

// ROUTES - get routes for constant data
// INDEX - see all trips per city - GET /api/activities/:cityId
// there's no place to look at all trips, just per city collection pages
router.get("/city/:cityId", authMiddleware, async (req, res) => {
    // it's just nyc, atlanta, or lyon
    const cityId = req.params.cityId;
    try {
        // this returns an array to be mapped in frontend into the cards
        const activities = await Activity.find({ city: cityId });

        res.json(activities);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// SHOW - view one activity and its data for modal - GET /api/activities/:activityId
router.get("/:activityId", authMiddleware, async (req, res) => {
    const activityId = req.params.activityId;

    try {
        // get the activity by id
        const activity = await Activity.findById(activityId);

        // check if it exists
        if (!activity) {
            return res.status(404).json({ message: "Activity not found" });
        }

        // return the activity object
        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

module.exports = router;