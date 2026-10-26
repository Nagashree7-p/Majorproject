const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const isAdmin = (user) => {
    return (
        String(user?.role || "user").toLowerCase() ===
        "admin"
    );
};

const getCurrentUserId = (user) => {
    return user?._id || user?.id || null;
};

router.post(
    "/",
    protect,
    async (req, res) => {
        try {
            const currentUserId =
                getCurrentUserId(req.user);

            if (!currentUserId) {
                return res.status(401).json({
                    message:
                        "Authenticated user not found"
                });
            }

            const {
                action,
                description,
                type
            } = req.body;

            if (!action || !description) {
                return res.status(400).json({
                    message:
                        "Action and description are required"
                });
            }

            const log =
                await ActivityLog.create({
                    action,
                    description,
                    user:
                        currentUserId,
                    type:
                        type || "System"
                });

            res.status(201).json({
                message:
                    "Activity log created successfully",
                log
            });
        } catch (error) {
            console.error(
                "Activity log creation error:",
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
    async (req, res) => {
        try {
            const currentUserId =
                getCurrentUserId(req.user);

            if (!currentUserId) {
                return res.status(401).json({
                    message:
                        "Authenticated user not found"
                });
            }

            const query =
                isAdmin(req.user)
                    ? {}
                    : {
                        user:
                            currentUserId
                    };

            const logs =
                await ActivityLog.find(
                    query
                )
                    .populate(
                        "user",
                        "name email role"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.json(
                logs
            );
        } catch (error) {
            console.error(
                "Activity log loading error:",
                error
            );

            res.status(500).json({
                message:
                    error.message
            });
        }
    }
);

router.delete(
    "/:id",
    protect,
    async (req, res) => {
        try {
            const log =
                await ActivityLog.findById(
                    req.params.id
                );

            if (!log) {
                return res.status(404).json({
                    message:
                        "Activity log not found"
                });
            }

            const currentUserId =
                getCurrentUserId(req.user);

            const canDelete =
                isAdmin(req.user) ||
                String(log.user) ===
                    String(currentUserId);

            if (!canDelete) {
                return res.status(403).json({
                    message:
                        "You are not allowed to delete this activity log"
                });
            }

            await ActivityLog.findByIdAndDelete(
                req.params.id
            );

            res.json({
                message:
                    "Activity log deleted successfully"
            });
        } catch (error) {
            console.error(
                "Activity log deletion error:",
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