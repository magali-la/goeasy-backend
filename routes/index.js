// Central hub for all routes
const router = require("express").Router();

// API Routes
const apiRoutes = require("./api/index.js");

// OAuth Routes
const authRoutes = require("./auth/index.js");

// API Routes prefix - /api
router.use("/api", apiRoutes);

// Auth Routes prefix - /auth
router.use("/auth", authRoutes);

// error handling - incorrect routes
router.use((req, res) => {
    res.status(404).json({ message: "Route not found. Check url." })
});

module.exports = router;