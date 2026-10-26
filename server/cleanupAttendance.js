const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Attendance = require("./models/Attendance");

dotenv.config();

const cleanup = async () => {
    try {
        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "MongoDB connected successfully"
        );

        const records =
            await Attendance.find({})
                .sort({
                    user: 1,
                    date: 1,
                    createdAt: -1
                });

        const groups = {};

        records.forEach(
            (record) => {
                const userId =
                    record.user?.toString() ||
                    "no-user";

                const date =
                    record.date || "no-date";

                const key =
                    `${userId}_${date}`;

                if (!groups[key]) {
                    groups[key] = [];
                }

                groups[key].push(
                    record
                );
            }
        );

        const duplicateIds = [];

        Object.values(groups).forEach(
            (group) => {
                if (
                    group.length > 1
                ) {
                    const keep =
                        group[0];

                    console.log(
                        `Keeping attendance: ${keep._id}`
                    );

                    for (
                        let i = 1;
                        i < group.length;
                        i++
                    ) {
                        console.log(
                            `Removing duplicate: ${group[i]._id}`
                        );

                        duplicateIds.push(
                            group[i]._id
                        );
                    }
                }
            }
        );

        if (
            duplicateIds.length ===
            0
        ) {
            console.log(
                "No duplicate attendance records found."
            );
        } else {
            await Attendance.deleteMany(
                {
                    _id: {
                        $in:
                            duplicateIds
                    }
                }
            );

            console.log(
                `${duplicateIds.length} duplicate attendance record(s) removed.`
            );
        }

        const remaining =
            await Attendance.countDocuments();

        console.log(
            `Remaining attendance records: ${remaining}`
        );

        await mongoose.disconnect();

        console.log(
            "Cleanup completed."
        );
    } catch (error) {
        console.error(
            "Cleanup error:",
            error
        );

        await mongoose.disconnect();
        process.exit(1);
    }
};

cleanup();