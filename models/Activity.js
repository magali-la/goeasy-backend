const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema ({
    title: { 
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    city: { 
        type: String, 
        enum: ["nyc", "atlanta", "lyon"], required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        enum: ["Free", "Food", "Music", "Art", "Event", "Views", "Landmark"],
        default: []
    }
}, { timestamps: true });

const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
