const mongoose = require("mongoose");

const crowdAnalysisSchema = new mongoose.Schema(
    {
        totalFaces: {
            type: Number,
            required: true
        },

        level: {
            type: String,
            enum: ["Empty", "Safe", "Moderate", "High", "Critical"],
            required: true
        },

        message: {
            type: String,
            required: true
        },

        detectedBoxes: {
            type: Array,
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "CrowdAnalysis",
    crowdAnalysisSchema
);