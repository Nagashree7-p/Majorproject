const express = require("express");
const Attendance = require("../models/Attendance");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const isAdmin = (user) => {
    return String(user?.role || "user").toLowerCase() === "admin";
};

const getCurrentUserId = (user) => {
    return user?._id || user?.id || null;
};

router.post("/", protect, async (req, res) => {
    try {
        const currentUserId = getCurrentUserId(req.user);

        if (!currentUserId) {
            return res.status(401).json({
                message: "Authenticated user not found"
            });
        }

        const attendanceData = {
            ...req.body
        };

        if (!isAdmin(req.user)) {
            attendanceData.user = currentUserId;
        }

        if (!attendanceData.user) {
            return res.status(400).json({
                message: "User is required"
            });
        }

        const today = new Date().toLocaleDateString("en-IN");

        const existingAttendance = await Attendance.findOne({
            user: attendanceData.user,
            date: today
        }).sort({
            createdAt: -1
        });

        if (existingAttendance) {
            return res.status(200).json({
                message: "Attendance already marked for today",
                alreadyMarked: true,
                record: existingAttendance
            });
        }

        attendanceData.date = today;

        const attendance = await Attendance.create(
            attendanceData
        );

        const populatedAttendance =
            await Attendance.findById(
                attendance._id
            ).populate(
                "user",
                "name email role"
            );

        res.status(201).json(
            populatedAttendance
        );

    } catch (error) {
        console.error(
            "Attendance creation error:",
            error
        );

        res.status(500).json({
            message: "Failed to create attendance",
            error: error.message
        });
    }
});

router.get("/", protect, async (req, res) => {
    try {
        const currentUserId = getCurrentUserId(req.user);

        if (!currentUserId) {
            return res.status(401).json({
                message: "Authenticated user not found"
            });
        }

        const query = isAdmin(req.user)
            ? {}
            : {
                user: currentUserId
            };

        const attendance = await Attendance.find(
            query
        )
            .populate(
                "user",
                "name email role"
            )
            .sort({
                createdAt: -1
            });

        res.json(attendance);

    } catch (error) {
        console.error(
            "Attendance fetch error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch attendance",
            error: error.message
        });
    }
});

module.exports = router;