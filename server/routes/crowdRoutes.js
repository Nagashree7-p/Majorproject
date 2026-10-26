const express = require("express");
const CrowdAnalysis = require("../models/CrowdAnalysis");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const isAdmin = (user) => {
    return (
        String(user?.role || "user").toLowerCase() ===
        "admin"
    );
};

const adminOnly = (req, res, next) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    next();
};

router.post(
    "/",
    protect,
    adminOnly,
    async (req, res) => {
        try {
            const {
                totalFaces,
                level,
                message,
                detectedBoxes
            } = req.body;

            const record =
                await CrowdAnalysis.create({
                    totalFaces,
                    level,
                    message,
                    detectedBoxes:
                        detectedBoxes || []
                });

            res.status(201).json({
                message:
                    "Crowd analysis saved successfully",
                record
            });
        } catch (error) {
            console.error(
                "Crowd analysis creation error:",
                error
            );

            res.status(500).json({
                message:
                    error.message
            });
        }
    }
);

router.get(
    "/",
    protect,
    adminOnly,
    async (req, res) => {
        try {
            const records =
                await CrowdAnalysis.find()
                    .sort({
                        createdAt: -1
                    });

            res.json(
                records
            );
        } catch (error) {
            console.error(
                "Crowd analysis loading error:",
                error
            );

            res.status(500).json({
                message:
                    error.message
            });
        }
    }
);

module.exports = router;