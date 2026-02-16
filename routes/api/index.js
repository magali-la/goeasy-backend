// Main hub for API routes
const router = require("express").Router();
const userRoutes = require("./userRoutes.js");
const tripRoutes = require("./tripRoutes.js");

// User Routes prefix - /api/users
router.use("/users", userRoutes);

// Trip Routes prefix /api/trips
router.use("/trips", tripRoutes);

module.exports = router;