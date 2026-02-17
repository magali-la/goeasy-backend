const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema ({
    title: {
        type: String,
        required: true,
        minlength: 4
    },
    description: {
        type: String,
        required: true,
        minlength: 4
    },
    city: {
        type: String,
        enum: ["nyc", "atlanta", "lyon"],
        required: true
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    isExact: {
        type: Boolean
    },
    // status for labels and filtering of trips
    status: {
        type: String,
        enum: ["planning", "upcoming", "ongoing", "archived"],
        default: "planning",
        required: true
    },
    // participants are a reference to the user ids, use it to populate the full user object in the routes to display their info in the trip details
    participants: {
        type: [mongoose.SchemaTypes.ObjectId],
        ref: 'User',
        default: []
    },
    // reference activities so that the full activity object can be populated in the route to display the details
    activities: [{
        activityId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Activity"
        },
        participants: {
            type: [mongoose.SchemaTypes.ObjectId],
            ref: "User",
            default: []
        }
    }]
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;