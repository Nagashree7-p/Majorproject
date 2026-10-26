const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const bcrypt = require("bcryptjs");

const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select("-password")
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getUserByName = async (req, res) => {
    try {
        const user = await User.findOne({
            name: {
                $regex: `^${req.params.name}$`,
                $options: "i"
            }
        }).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const { name, email, password } = req.body;

        if (name) {
            user.name = name.trim();
        }

        if (email) {
            const existingUser = await User.findOne({
                email: email.trim().toLowerCase(),
                _id: { $ne: user._id }
            });

            if (existingUser) {
                return res.status(400).json({
                    message: "Email already in use"
                });
            }

            user.email = email.trim().toLowerCase();
        }

        if (password) {
            user.password = await bcrypt.hash(
                password,
                10
            );
        }

        await user.save();

        await ActivityLog.create({
            action: "Profile Updated",
            description: `${user.name} updated their profile information`,
            user: user._id,
            type: "System"
        });

        res.json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    getUsers,
    getUserByName,
    updateUser
};