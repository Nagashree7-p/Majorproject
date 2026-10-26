const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/UserRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const crowdRoutes = require("./routes/crowdRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const faceRoutes = require("./routes/faceRoutes");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
    res.json({
        message: "FaceGuard AI Server is running"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/crowd", crowdRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/faces", faceRoutes);

const PORT = process.env.PORT || 5000;

app.get("/test", (req, res) => {
    res.json({
        message: "Server.js is working"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});