const mongoose = require("mongoose");

const faceEmbeddingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        name: {
            type: String,
            required: true
        },

        embedding: {
            type: [Number],
            required: true
        },

        model: {
            type: String,
            default: "ArcFace"
        },

        imagePath: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "FaceEmbedding",
    faceEmbeddingSchema
);