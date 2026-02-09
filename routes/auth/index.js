// Main hub for OAuth routes
const router = require("express").Router();
const googleRoutes = require("./googleRoutes.js");

// Google Routes prefix - /auth/google
router.use("/google", googleRoutes);

module.exports = router;