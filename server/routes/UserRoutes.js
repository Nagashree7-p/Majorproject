const express = require("express");

const {
    getUsers,
    getUserByName,
    updateUser
} = require("../controllers/UserController");

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

const adminOnly = (req, res, next) => {
    if (!isAdmin(req.user)) {
        return res.status(403).json({
            message:
                "Admin access required"
        });
    }

    next();
};

const ownUserOnly = (req, res, next) => {
    if (isAdmin(req.user)) {
        return next();
    }

    const currentUserId =
        getCurrentUserId(req.user);

    if (
        String(currentUserId) !==
        String(req.params.id)
    ) {
        return res.status(403).json({
            message:
                "You are not allowed to access another user's account"
        });
    }

    next();
};

const ownNameOnly = (req, res, next) => {
    if (isAdmin(req.user)) {
        return next();
    }

    const currentUserName =
        String(req.user?.name || "")
            .trim()
            .toLowerCase();

    const requestedName =
        String(req.params.name || "")
            .trim()
            .toLowerCase();

    if (
        !currentUserName ||
        currentUserName !== requestedName
    ) {
        return res.status(403).json({
            message:
                "You are not allowed to access another user's account"
        });
    }

    next();
};

router.get(
    "/",
    protect,
    adminOnly,
    getUsers
);

router.get(
    "/name/:name",
    protect,
    ownNameOnly,
    getUserByName
);

router.put(
    "/:id",
    protect,
    ownUserOnly,
    updateUser
);

module.exports = router;