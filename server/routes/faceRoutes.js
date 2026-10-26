const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const FaceEmbedding = require("../models/FaceEmbedding");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

const uploadDir = path.join(
    __dirname,
    "../uploads/faces"
);

const registeredFacesFile = path.join(
    __dirname,
    "../../ai/face_recognition/registered_faces.json"
);

const pythonExecutable = path.join(
    __dirname,
    "../../ai/venv/Scripts/python.exe"
);

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension =
            path.extname(file.originalname) ||
            ".jpg";

        cb(
            null,
            `${Date.now()}-${Math.round(
                Math.random() * 1e9
            )}${extension}`
        );
    }
});

const upload = multer({
    storage
});

const isAdmin = (user) => {
    return (
        String(user?.role || "user").toLowerCase() ===
        "admin"
    );
};

const getCurrentUserId = (user) => {
    return user?._id || user?.id || null;
};

const canAccessUser = (req, userId) => {
    if (isAdmin(req.user)) {
        return true;
    }

    const currentUserId =
        getCurrentUserId(req.user);

    return (
        String(currentUserId) ===
        String(userId)
    );
};

const loadRegisteredFaces = () => {
    try {
        if (!fs.existsSync(registeredFacesFile)) {
            return {};
        }

        const data = fs.readFileSync(
            registeredFacesFile,
            "utf8"
        );

        return data.trim()
            ? JSON.parse(data)
            : {};
    } catch (error) {
        console.error(
            "Unable to read registered faces:",
            error
        );

        return {};
    }
};

const saveRegisteredFaces = (data) => {
    const directory =
        path.dirname(
            registeredFacesFile
        );

    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, {
            recursive: true
        });
    }

    fs.writeFileSync(
        registeredFacesFile,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
};

const addRegisteredFace = (
    name,
    embedding
) => {
    const data =
        loadRegisteredFaces();

    data[name] = {
        name,
        embedding
    };

    saveRegisteredFaces(data);
};

const removeRegisteredFace = (
    name
) => {
    const data =
        loadRegisteredFaces();

    if (data[name]) {
        delete data[name];
        saveRegisteredFaces(data);
    }
};

router.post(
    "/register",
    protect,
    upload.single("image"),
    async (req, res) => {
        let imagePath = "";

        try {
            const currentUserId =
                getCurrentUserId(req.user);

            if (!currentUserId) {
                if (req.file?.path &&
                    fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }

                return res.status(401).json({
                    message:
                        "Authenticated user was not found"
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    message:
                        "Face image is required"
                });
            }

            imagePath =
                req.file.path;

            let targetUserId =
                currentUserId;

            if (
                isAdmin(req.user) &&
                req.body.userId
            ) {
                targetUserId =
                    req.body.userId;
            }

            if (
                !isAdmin(req.user) &&
                req.body.userId &&
                String(req.body.userId) !==
                    String(currentUserId)
            ) {
                if (
                    fs.existsSync(imagePath)
                ) {
                    fs.unlinkSync(
                        imagePath
                    );
                }

                return res.status(403).json({
                    message:
                        "You can register a face only for your own account"
                });
            }

            const user =
                await User.findById(
                    targetUserId
                );

            if (!user) {
                if (
                    fs.existsSync(imagePath)
                ) {
                    fs.unlinkSync(
                        imagePath
                    );
                }

                return res.status(404).json({
                    message:
                        "User not found"
                });
            }

            const existingEmbedding =
                await FaceEmbedding.findOne({
                    user: user._id
                });

            if (existingEmbedding) {
                if (
                    fs.existsSync(imagePath)
                ) {
                    fs.unlinkSync(
                        imagePath
                    );
                }

                return res.status(400).json({
                    message:
                        "Face is already registered for this user"
                });
            }

            if (
                !fs.existsSync(
                    pythonExecutable
                )
            ) {
                if (
                    fs.existsSync(imagePath)
                ) {
                    fs.unlinkSync(
                        imagePath
                    );
                }

                return res.status(500).json({
                    message:
                        "AI virtual environment Python was not found"
                });
            }

            const pythonScript =
                path.join(
                    __dirname,
                    "../../ai/face_recognition/generate_embedding.py"
                );

            execFile(
                pythonExecutable,
                [
                    pythonScript,
                    imagePath
                ],
                async (
                    error,
                    stdout,
                    stderr
                ) => {
                    try {
                        if (error) {
                            console.error(
                                "Python error:",
                                stderr
                            );

                            if (
                                fs.existsSync(
                                    imagePath
                                )
                            ) {
                                fs.unlinkSync(
                                    imagePath
                                );
                            }

                            return res.status(500).json({
                                message:
                                    "Unable to generate face embedding"
                            });
                        }

                        const output =
                            stdout.trim();

                        const embeddingLine =
                            output
                                .split(/\r?\n/)
                                .find(
                                    (line) =>
                                        line.startsWith(
                                            "EMBEDDING:"
                                        )
                                );

                        if (
                            !embeddingLine
                        ) {
                            console.error(
                                "Python output:",
                                output
                            );

                            if (
                                fs.existsSync(
                                    imagePath
                                )
                            ) {
                                fs.unlinkSync(
                                    imagePath
                                );
                            }

                            return res.status(500).json({
                                message:
                                    "Face embedding was not generated"
                            });
                        }

                        const embeddingText =
                            embeddingLine.replace(
                                "EMBEDDING:",
                                ""
                            );

                        const embedding =
                            JSON.parse(
                                embeddingText
                            );

                        if (
                            !Array.isArray(
                                embedding
                            ) ||
                            embedding.length === 0
                        ) {
                            if (
                                fs.existsSync(
                                    imagePath
                                )
                            ) {
                                fs.unlinkSync(
                                    imagePath
                                );
                            }

                            return res.status(500).json({
                                message:
                                    "Invalid face embedding"
                            });
                        }

                        const faceEmbedding =
                            await FaceEmbedding.create({
                                user:
                                    user._id,
                                name:
                                    user.name,
                                embedding,
                                model:
                                    "ArcFace",
                                imagePath
                            });

                        addRegisteredFace(
                            user.name,
                            embedding
                        );

                        await ActivityLog.create({
                            action:
                                "Face Registration",
                            description:
                                `${user.name}'s face was registered successfully using ArcFace`,
                            user:
                                user._id,
                            type:
                                "Face Authentication"
                        });

                        res.status(201).json({
                            message:
                                "Face registered successfully",
                            faceEmbedding: {
                                id:
                                    faceEmbedding._id,
                                user:
                                    faceEmbedding.user,
                                name:
                                    faceEmbedding.name,
                                model:
                                    faceEmbedding.model
                            }
                        });
                    } catch (
                        innerError
                    ) {
                        console.error(
                            "Face registration error:",
                            innerError
                        );

                        if (
                            fs.existsSync(
                                imagePath
                            )
                        ) {
                            fs.unlinkSync(
                                imagePath
                            );
                        }

                        res.status(500).json({
                            message:
                                innerError.message
                        });
                    }
                }
            );
        } catch (error) {
            console.error(
                "Face registration route error:",
                error
            );

            if (
                imagePath &&
                fs.existsSync(imagePath)
            ) {
                fs.unlinkSync(
                    imagePath
                );
            }

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
            if (!isAdmin(req.user)) {
                const currentUserId =
                    getCurrentUserId(
                        req.user
                    );

                const embedding =
                    await FaceEmbedding.findOne({
                        user:
                            currentUserId
                    })
                        .populate(
                            "user",
                            "name email role"
                        )
                        .select(
                            "-embedding"
                        );

                if (!embedding) {
                    return res.json([]);
                }

                return res.json([
                    embedding
                ]);
            }

            const embeddings =
                await FaceEmbedding.find()
                    .populate(
                        "user",
                        "name email role"
                    )
                    .select(
                        "-embedding"
                    )
                    .sort({
                        createdAt: -1
                    });

            res.json(
                embeddings
            );
        } catch (error) {
            res.status(500).json({
                message:
                    error.message
            });
        }
    }
);

router.get(
    "/user/:userId",
    protect,
    async (req, res) => {
        try {
            if (
                !canAccessUser(
                    req,
                    req.params.userId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not allowed to access this user's face registration"
                });
            }

            const embedding =
                await FaceEmbedding.findOne({
                    user:
                        req.params.userId
                })
                    .populate(
                        "user",
                        "name email role"
                    )
                    .select(
                        "-embedding"
                    );

            if (!embedding) {
                return res.status(404).json({
                    message:
                        "Face is not registered for this user"
                });
            }

            res.json(
                embedding
            );
        } catch (error) {
            res.status(500).json({
                message:
                    error.message
            });
        }
    }
);

router.delete(
    "/user/:userId",
    protect,
    async (req, res) => {
        try {
            if (
                !canAccessUser(
                    req,
                    req.params.userId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not allowed to remove this user's face registration"
                });
            }

            const embedding =
                await FaceEmbedding.findOne({
                    user:
                        req.params.userId
                });

            if (!embedding) {
                return res.status(404).json({
                    message:
                        "Face registration not found"
                });
            }

            if (
                embedding.imagePath &&
                fs.existsSync(
                    embedding.imagePath
                )
            ) {
                fs.unlinkSync(
                    embedding.imagePath
                );
            }

            removeRegisteredFace(
                embedding.name
            );

            await FaceEmbedding.findByIdAndDelete(
                embedding._id
            );

            await ActivityLog.create({
                action:
                    "Face Registration Removed",
                description:
                    `${embedding.name}'s face registration was removed`,
                user:
                    embedding.user,
                type:
                    "Face Authentication"
            });

            res.json({
                message:
                    "Face registration removed successfully"
            });
        } catch (error) {
            res.status(500).json({
                message:
                    error.message
            });
        }
    }
);

module.exports = router;