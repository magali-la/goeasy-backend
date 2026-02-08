// Main hub for API routes
const router = require("express").Router();
const userRoutes = require("./userRoutes.js");

// User Routes prefix - /api/users
router.use("/users", userRoutes);

module.exports = router;