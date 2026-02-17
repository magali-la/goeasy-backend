// Main hub for API routes
const router = require("express").Router();
const userRoutes = require("./userRoutes.js");
const tripRoutes = require("./tripRoutes.js");
const activityRoutes = require("./activityRoutes.js");

// User Routes prefix - /api/users
router.use("/users", userRoutes);

// Trip Routes prefix /api/trips
router.use("/trips", tripRoutes);

// Activity Routes prefis /api/activities
router.use("/activities", activityRoutes)

module.exports = router;