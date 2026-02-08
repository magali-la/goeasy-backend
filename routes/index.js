// Central hub for all routes
const router = require("express").Router();

// API Routes
const apiRoutes = require("./api/index.js");

// API Routes prefix - /api
router.use("/api", apiRoutes);

// error handling - incorrect routes
router.use((req, res) => {
    res.status(404).json({ message: "Route not found. Check url." })
});

module.exports = router;