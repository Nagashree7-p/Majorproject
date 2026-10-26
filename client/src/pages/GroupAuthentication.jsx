import { useEffect, useRef, useState } from "react";
import {
    Camera,
    Users,
    ScanFace,
    ShieldCheck,
    ShieldAlert,
    Loader2
} from "lucide-react";

function GroupAuthentication() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [attendanceSaved, setAttendanceSaved] = useState([]);

    const startCamera = async () => {
        try {
            setError("");

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: "user"
                    },
                    audio: false
                });

            streamRef.current = stream;
            videoRef.current.srcObject = stream;

            setCameraActive(true);
        } catch (err) {
            setError(
                "Unable to access camera. Please allow camera permission."
            );
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    const saveActivityLog = async ({
        action,
        description,
        user = null,
        type = "System"
    }) => {
        try {
            await fetch(
                "http://localhost:5000/api/activity-logs",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        action,
                        description,
                        user,
                        type
                    })
                }
            );
        } catch (error) {
            console.error(
                "Activity log error:",
                error
            );
        }
    };

    const saveGroupAttendance = async (people) => {
        const token = localStorage.getItem("token");

        if (!token) {
            throw new Error(
                "User session not found. Please login again."
            );
        }

        const today =
            new Date().toISOString().split("T")[0];

        const savedNames = [];

        for (const person of people) {
            if (
                !person.recognized ||
                person.name === "Unknown"
            ) {
                continue;
            }

            try {
                const userResponse = await fetch(
                    `http://localhost:5000/api/users/name/${encodeURIComponent(
                        person.name
                    )}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const userData =
                    await userResponse.json();

                if (!userResponse.ok) {
                    continue;
                }

                const attendanceResponse = await fetch(
                    "http://localhost:5000/api/attendance"
                );

                const attendanceRecords =
                    await attendanceResponse.json();

                const alreadyMarked =
                    Array.isArray(attendanceRecords)
                        ? attendanceRecords.some(
                              (record) =>
                                  record.user?._id ===
                                      userData._id &&
                                  record.date === today &&
                                  record.method ===
                                      "Group Face"
                          )
                        : false;

                if (alreadyMarked) {
                    continue;
                }

                const now = new Date();

                const attendanceData = {
                    user: userData._id,
                    name: userData.name,
                    date: today,
                    time: now.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                    }),
                    status: "Present",
                    method: "Group Face",
                    confidence: person.confidence
                };

                const saveResponse = await fetch(
                    "http://localhost:5000/api/attendance",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json"
                        },
                        body: JSON.stringify(
                            attendanceData
                        )
                    }
                );

                if (saveResponse.ok) {
                    savedNames.push(
                        userData.name
                    );
                }
            } catch (error) {
                console.error(
                    `Attendance error for ${person.name}:`,
                    error
                );
            }
        }

        setAttendanceSaved(savedNames);

        return savedNames;
    };

    const recognizeGroup = async () => {
        if (
            !videoRef.current ||
            !canvasRef.current
        ) {
            return;
        }

        try {
            setScanning(true);
            setResult(null);
            setError("");
            setAttendanceSaved([]);

            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext("2d");

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const blob = await new Promise(
                (resolve) => {
                    canvas.toBlob(
                        (imageBlob) =>
                            resolve(imageBlob),
                        "image/jpeg",
                        0.9
                    );
                }
            );

            if (!blob) {
                throw new Error(
                    "Unable to capture image"
                );
            }

            const formData = new FormData();

            formData.append(
                "image",
                blob,
                "group.jpg"
            );

            const response = await fetch(
                "http://127.0.0.1:8000/group-recognize",
                {
                    method: "POST",
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Group recognition failed"
                );
            }

            setResult(data);

            if (
                Array.isArray(data.results) &&
                data.results.length > 0
            ) {
                const savedNames =
                    await saveGroupAttendance(
                        data.results
                    );

                const recognizedPeople =
                    data.results.filter(
                        (person) =>
                            person.recognized &&
                            person.name !==
                                "Unknown"
                    );

                const unknownPeople =
                    data.results.filter(
                        (person) =>
                            !person.recognized ||
                            person.name === "Unknown"
                    );

                const recognizedNames =
                    recognizedPeople.map(
                        (person) =>
                            person.name
                    );

                await saveActivityLog({
                    action: "Group Authentication",
                    description:
                        recognizedNames.length > 0
                            ? `Group authentication detected ${data.total_faces} faces. Recognized: ${recognizedNames.join(", ")}. Unknown: ${unknownPeople.length}.`
                            : `Group authentication detected ${data.total_faces} faces. No registered identities were recognized.`,
                    user: null,
                    type: "Group Authentication"
                });

                if (
                    savedNames.length > 0
                ) {
                    for (const name of savedNames) {
                        try {
                            const userResponse =
                                await fetch(
                                    `http://localhost:5000/api/users/name/${encodeURIComponent(
                                        name
                                    )}`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${localStorage.getItem(
                                                "token"
                                            )}`
                                        }
                                    }
                                );

                            if (
                                userResponse.ok
                            ) {
                                const userData =
                                    await userResponse.json();

                                await saveActivityLog({
                                    action:
                                        "Attendance Recorded",
                                    description:
                                        `Group face attendance recorded for ${name}`,
                                    user:
                                        userData._id ||
                                        null,
                                    type:
                                        "Attendance"
                                });
                            }
                        } catch (error) {
                            console.error(
                                "Attendance activity log error:",
                                error
                            );
                        }
                    }
                }
            } else {
                await saveActivityLog({
                    action: "Group Authentication",
                    description:
                        "Group authentication completed with no faces detected.",
                    user: null,
                    type: "Group Authentication"
                });
            }
        } catch (err) {
            setError(
                err.message ||
                    "Group recognition failed"
            );
        } finally {
            setScanning(false);
        }
    };

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) =>
                        track.stop()
                    );
            }
        };
    }, []);

    return (
        <div className="page-container">

            <div className="page-header">
                <div>

                    <h1>
                        Group Authentication
                    </h1>

                    <p>
                        Recognize multiple registered
                        faces using AI-powered group
                        authentication.
                    </p>

                </div>

                <div className="security-badge">

                    <ShieldCheck size={18} />

                    Multi-Face AI Active

                </div>
            </div>

            <div className="face-auth-grid">

                <div className="face-camera-card">

                    <div className="camera-header">

                        <div>

                            <h2>
                                <Users size={22} />
                                Group Face Scanner
                            </h2>

                            <p>
                                Position multiple people
                                inside the camera frame.
                            </p>

                        </div>

                        <div
                            className={`camera-status ${
                                cameraActive
                                    ? "active"
                                    : ""
                            }`}
                        >

                            <span></span>

                            {cameraActive
                                ? "Camera Active"
                                : "Camera Off"}

                        </div>

                    </div>

                    <div className="camera-wrapper">

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="face-video"
                        />

                        {!cameraActive && (
                            <div className="camera-placeholder">

                                <Users size={55} />

                                <h3>
                                    Camera is not active
                                </h3>

                                <p>
                                    Start the camera to scan
                                    multiple faces.
                                </p>

                            </div>
                        )}

                        {cameraActive && (
                            <div className="face-scan-frame">

                                <span className="corner top-left"></span>

                                <span className="corner top-right"></span>

                                <span className="corner bottom-left"></span>

                                <span className="corner bottom-right"></span>

                                {scanning && (
                                    <div className="scan-line"></div>
                                )}

                            </div>
                        )}

                    </div>

                    <canvas
                        ref={canvasRef}
                        style={{
                            display: "none"
                        }}
                    />

                    {error && (
                        <div className="face-error">

                            <ShieldAlert size={20} />

                            <span>
                                {error}
                            </span>

                        </div>
                    )}

                    <div className="camera-actions">

                        {!cameraActive ? (
                            <button
                                className="primary-btn"
                                onClick={startCamera}
                            >
                                <Camera size={20} />

                                Start Camera
                            </button>
                        ) : (
                            <>
                                <button
                                    className="primary-btn"
                                    onClick={recognizeGroup}
                                    disabled={scanning}
                                >
                                    {scanning ? (
                                        <>
                                            <Loader2
                                                size={20}
                                                className="spin"
                                            />

                                            Scanning Group...
                                        </>
                                    ) : (
                                        <>
                                            <ScanFace
                                                size={20}
                                            />

                                            Recognize Group
                                        </>
                                    )}
                                </button>

                                <button
                                    className="secondary-btn"
                                    onClick={stopCamera}
                                    disabled={scanning}
                                >
                                    Stop Camera
                                </button>
                            </>
                        )}

                    </div>

                </div>

                <div className="face-result-card">

                    <div className="result-header">

                        <h2>
                            Group Recognition Result
                        </h2>

                        <span>
                            ArcFace AI
                        </span>

                    </div>

                    {!result && !scanning && (
                        <div className="result-empty">

                            <Users size={60} />

                            <h3>
                                Ready for Group
                                Authentication
                            </h3>

                            <p>
                                Start the camera and scan
                                a group. The AI engine
                                will detect and recognize
                                multiple faces.
                            </p>

                        </div>
                    )}

                    {scanning && (
                        <div className="result-empty">

                            <Loader2
                                size={60}
                                className="spin"
                            />

                            <h3>
                                Analyzing Group...
                            </h3>

                            <p>
                                Detecting and comparing
                                multiple facial
                                embeddings.
                            </p>

                        </div>
                    )}

                    {result && !scanning && (
                        <div className="authentication-result">

                            <div className="group-summary">

                                <div className="group-stat">

                                    <span>
                                        Total Faces
                                    </span>

                                    <strong>
                                        {result.total_faces}
                                    </strong>

                                </div>

                                <div className="group-stat recognized-stat">

                                    <span>
                                        Recognized
                                    </span>

                                    <strong>
                                        {result.recognized}
                                    </strong>

                                </div>

                                <div className="group-stat unknown-stat">

                                    <span>
                                        Unknown
                                    </span>

                                    <strong>
                                        {result.unknown}
                                    </strong>

                                </div>

                            </div>

                            <div className="group-results">

                                <h3>
                                    Detected People
                                </h3>

                                {result.results?.length === 0 ? (
                                    <div className="result-message unknown-message">
                                        No faces detected.
                                    </div>
                                ) : (
                                    result.results.map(
                                        (
                                            person,
                                            index
                                        ) => (
                                            <div
                                                className="group-person"
                                                key={
                                                    index
                                                }
                                            >

                                                <div className="person-icon">

                                                    {person.recognized ? (
                                                        <ShieldCheck
                                                            size={
                                                                22
                                                            }
                                                        />
                                                    ) : (
                                                        <ShieldAlert
                                                            size={
                                                                22
                                                            }
                                                        />
                                                    )}

                                                </div>

                                                <div className="person-info">

                                                    <strong>
                                                        {
                                                            person.name
                                                        }
                                                    </strong>

                                                    <span>
                                                        {person.recognized
                                                            ? "Identity Verified"
                                                            : "Unknown Person"}
                                                    </span>

                                                </div>

                                                <div className="person-confidence">

                                                    {
                                                        person.confidence
                                                    }%

                                                </div>

                                            </div>
                                        )
                                    )
                                )}

                            </div>

                            {attendanceSaved.length > 0 && (
                                <div className="result-message success-message">

                                    Attendance recorded
                                    for:{" "}

                                    {attendanceSaved.join(
                                        ", "
                                    )}

                                </div>
                            )}

                            {result.recognized > 0 &&
                                attendanceSaved.length === 0 && (
                                    <div className="result-message success-message">

                                        Attendance already
                                        recorded for today's
                                        group scan.

                                    </div>
                                )}

                        </div>
                    )}

                </div>

            </div>

        </div>
    );
}

export default GroupAuthentication;