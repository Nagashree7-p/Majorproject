const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        type: {
            type: String,
            enum: [
                "Face Authentication",
                "Group Authentication",
                "Crowd Analysis",
                "Attendance",
                "User Registration",
                "Login",
                "System"
            ],
            default: "System"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ActivityLog",
    activityLogSchema
);