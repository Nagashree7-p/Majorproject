const Attendance = require("../models/Attendance");

const createAttendance = async (req, res) => {
    try {
        const {
            user,
            name,
            date,
            time,
            status,
            method,
            confidence
        } = req.body;

        const attendance = await Attendance.create({
            user,
            name,
            date,
            time,
            status,
            method,
            confidence
        });

        res.status(201).json({
            message: "Attendance recorded successfully",
            attendance
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json(attendance);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    createAttendance,
    getAttendance
};