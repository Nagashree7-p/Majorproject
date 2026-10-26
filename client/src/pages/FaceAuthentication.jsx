import { useEffect, useRef, useState } from "react";
import {
    Camera,
    CameraOff,
    ScanFace,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Loader2,
    LockKeyhole,
    UserCheck,
    UserX,
    Activity,
    Fingerprint,
    RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function FaceAuthentication() {
    const { user } = useAuth();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [scanImage, setScanImage] = useState("");
    const [recentAuth, setRecentAuth] = useState([]);

    const isAdmin =
        String(user?.role || "user").toLowerCase() === "admin";

    const currentUserId =
        user?.id || user?._id;

    const currentUserName =
        String(user?.name || "").trim();

    useEffect(() => {
        if (user) {
            loadRecentActivity();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }

            if (scanImage) {
                URL.revokeObjectURL(scanImage);
            }
        };
    }, [user]);

    const loadRecentActivity = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            const response = await fetch(
                "http://localhost:5000/api/activity-logs",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                return;
            }

            let filtered = Array.isArray(data)
                ? data.filter(
                      (item) =>
                          item.action === "Face Authentication"
                  )
                : [];

            if (!isAdmin) {
                filtered = filtered.filter((item) => {
                    const activityUserId =
                        typeof item.user === "object"
                            ? item.user?._id ||
                              item.user?.id
                            : item.user;

                    return (
                        String(activityUserId) ===
                        String(currentUserId)
                    );
                });
            }

            setRecentAuth(filtered.slice(0, 6));
        } catch (error) {
            console.error(
                "Authentication activity loading error:",
                error
            );
        }
    };

    const startCamera = async () => {
        try {
            setError("");
            setResult(null);

            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Camera is not supported by this browser"
                );
            }

            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());

                streamRef.current = null;
            }

            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: {
                            ideal: 640
                        },
                        height: {
                            ideal: 480
                        },
                        facingMode: "user"
                    },
                    audio: false
                });

            streamRef.current = stream;

            const video = videoRef.current;

            if (!video) {
                throw new Error(
                    "Camera preview is unavailable"
                );
            }

            video.srcObject = stream;

            video.onloadedmetadata = async () => {
                try {
                    await video.play();

                    setCameraActive(true);

                    toast.success(
                        "Authentication camera ready"
                    );
                } catch (error) {
                    console.error(error);

                    setError(
                        "Unable to start camera preview"
                    );

                    toast.error(
                        "Unable to start camera preview"
                    );
                }
            };
        } catch (error) {
            console.error(error);

            setError(
                error.message ||
                    "Unable to access camera"
            );

            toast.error(
                error.message ||
                    "Unable to access camera"
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
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
    };

    const saveActivityLog = async (
        description
    ) => {
        try {
            const token =
                localStorage.getItem("token");

            if (!token) {
                return;
            }

            await fetch(
                "http://localhost:5000/api/activity-logs",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        action:
                            "Face Authentication",
                        description,
                        user:
                            currentUserId || null,
                        type:
                            "Face Authentication"
                    })
                }
            );
        } catch (logError) {
            console.error(
                "Activity log error:",
                logError
            );
        }
    };

    const createAttendance = async (
        matchedUser,
        confidence
    ) => {
        try {
            const token =
                localStorage.getItem("token");

            if (!token) {
                return;
            }

            const now =
                new Date();

            const date =
                now.toLocaleDateString(
                    "en-IN"
                );

            const time =
                now.toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );

            await fetch(
                "http://localhost:5000/api/attendance",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        user:
                            isAdmin
                                ? matchedUser?._id
                                : currentUserId,
                        name:
                            isAdmin
                                ? matchedUser?.name
                                : currentUserName,
                        date,
                        time,
                        status:
                            "Present",
                        method:
                            "Individual Face",
                        confidence
                    })
                }
            );
        } catch (attendanceError) {
            console.error(
                "Attendance error:",
                attendanceError
            );
        }
    };

    const authenticateFace = async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) {
            toast.error(
                "Camera is not available"
            );
            return;
        }

        if (!cameraActive) {
            toast.error(
                "Start verification first"
            );
            return;
        }

        if (
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {
            toast.error(
                "Camera is not ready yet"
            );
            return;
        }

        try {
            setProcessing(true);
            setError("");
            setResult(null);

            canvas.width =
                video.videoWidth;

            canvas.height =
                video.videoHeight;

            const context =
                canvas.getContext("2d");

            if (!context) {
                throw new Error(
                    "Unable to capture camera frame"
                );
            }

            context.drawImage(
                video,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const blob =
                await new Promise(
                    (resolve) => {
                        canvas.toBlob(
                            (imageBlob) => {
                                resolve(
                                    imageBlob
                                );
                            },
                            "image/jpeg",
                            0.95
                        );
                    }
                );

            if (!blob) {
                throw new Error(
                    "Unable to create scan image"
                );
            }

            const imageUrl =
                URL.createObjectURL(blob);

            if (scanImage) {
                URL.revokeObjectURL(
                    scanImage
                );
            }

            setScanImage(imageUrl);

            const formData =
                new FormData();

            formData.append(
                "image",
                blob,
                "face-authentication.jpg"
            );

            const aiResponse =
                await fetch(
                    "http://127.0.0.1:8000/recognize",
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const aiData =
                await aiResponse.json();

            if (!aiResponse.ok) {
                throw new Error(
                    aiData.error ||
                        aiData.message ||
                        "Face recognition failed"
                );
            }

            const recognized =
                aiData.recognized === true;

            const detectedName =
                aiData.name ||
                "Unknown";

            const confidence =
                Number(
                    aiData.confidence || 0
                );

            const normalizedDetectedName =
                detectedName
                    .trim()
                    .toLowerCase();

            const normalizedCurrentUserName =
                currentUserName
                    .trim()
                    .toLowerCase();

            /*
             * ADMIN:
             * Admin can authenticate any
             * registered face.
             *
             * NORMAL USER:
             * The recognized identity must
             * match the currently logged-in
             * account.
             */

            if (recognized && !isAdmin) {
                const identityMatches =
                    normalizedDetectedName ===
                    normalizedCurrentUserName;

                if (!identityMatches) {
                    const mismatchResult = {
                        recognized: false,
                        mismatch: true,
                        name:
                            "Different Registered User",
                        confidence
                    };

                    setResult(
                        mismatchResult
                    );

                    await saveActivityLog(
                        `Face verification failed because the detected registered identity does not match the logged-in user ${currentUserName}. Match score: ${confidence.toFixed(
                            2
                        )}%`
                    );

                    toast.error(
                        "Face does not match your account"
                    );

                    await loadRecentActivity();

                    return;
                }

                const authenticationResult = {
                    recognized: true,
                    mismatch: false,
                    name:
                        currentUserName,
                    confidence
                };

                setResult(
                    authenticationResult
                );

                await createAttendance(
                    {
                        _id:
                            currentUserId,
                        name:
                            currentUserName
                    },
                    confidence
                );

                await saveActivityLog(
                    `${currentUserName} was authenticated successfully with ${confidence.toFixed(
                        2
                    )}% confidence`
                );

                toast.success(
                    "Your identity was verified successfully"
                );

                await loadRecentActivity();

                return;
            }

            if (recognized && isAdmin) {
                let matchedUser = null;

                try {
                    const token =
                        localStorage.getItem(
                            "token"
                        );

                    const userResponse =
                        await fetch(
                            `http://localhost:5000/api/users/name/${encodeURIComponent(
                                detectedName
                            )}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );

                    const userData =
                        await userResponse.json();

                    matchedUser =
                        Array.isArray(
                            userData
                        )
                            ? userData[0]
                            : userData;
                } catch (userLookupError) {
                    console.error(
                        "Recognized user lookup error:",
                        userLookupError
                    );
                }

                const authenticationResult = {
                    recognized: true,
                    mismatch: false,
                    name:
                        matchedUser?.name ||
                        detectedName,
                    confidence
                };

                setResult(
                    authenticationResult
                );

                if (matchedUser?._id) {
                    await createAttendance(
                        matchedUser,
                        confidence
                    );
                }

                await saveActivityLog(
                    `${matchedUser?.name || detectedName} was authenticated successfully with ${confidence.toFixed(
                        2
                    )}% confidence`
                );

                toast.success(
                    `${matchedUser?.name || detectedName} verified successfully`
                );

                await loadRecentActivity();

                return;
            }

            const unknownResult = {
                recognized: false,
                mismatch: false,
                name: "Unknown",
                confidence
            };

            setResult(
                unknownResult
            );

            await saveActivityLog(
                `Unknown face detected with ${confidence.toFixed(
                    2
                )}% confidence`
            );

            toast.error(
                "Identity could not be verified"
            );

            await loadRecentActivity();
        } catch (error) {
            console.error(
                "Face authentication error:",
                error
            );

            setError(
                error.message ||
                    "Face authentication failed"
            );

            toast.error(
                error.message ||
                    "Face authentication failed"
            );
        } finally {
            setProcessing(false);
        }
    };

    const resetScan = () => {
        setResult(null);
        setError("");

        if (scanImage) {
            URL.revokeObjectURL(
                scanImage
            );
        }

        setScanImage("");
    };

    const formatActivityTime = (
        value
    ) => {
        if (!value) {
            return "--";
        }

        const date =
            new Date(value);

        if (
            isNaN(
                date.getTime()
            )
        ) {
            return "--";
        }

        return date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    return (
        <div className="fa-page">

            <div className="fa-header">

                <div className="fa-header-left">

                    <div className="fa-icon-box">
                        <Fingerprint size={26} />
                    </div>

                    <div>

                        <span className="fa-eyebrow">
                            BIOMETRIC SECURITY
                        </span>

                        <h1>
                            Face Authentication
                        </h1>

                        <p>
                            Verify identity using
                            live ArcFace recognition.
                        </p>

                    </div>

                </div>

                <div className="fa-security-badge">
                    <ShieldCheck size={17} />
                    Secure Verification
                </div>

            </div>

            <div className="fa-status-strip">

                <div className="fa-status-item">

                    <span className="fa-status-dot"></span>

                    Authentication Engine

                    <strong>
                        Online
                    </strong>

                </div>

                <div className="fa-status-divider"></div>

                <div className="fa-status-item">

                    <ScanFace size={16} />

                    ArcFace

                    <strong>
                        Ready
                    </strong>

                </div>

                <div className="fa-status-divider"></div>

                <div className="fa-status-item">

                    <LockKeyhole size={16} />

                    Secure Channel

                    <strong>
                        Active
                    </strong>

                </div>

            </div>

            <div className="fa-grid">

                <div className="fa-scanner-card">

                    <div className="fa-card-top">

                        <div>

                            <span>
                                LIVE VERIFICATION
                            </span>

                            <h2>
                                Identity Scanner
                            </h2>

                        </div>

                        <div
                            className={`fa-live-indicator ${
                                cameraActive
                                    ? "active"
                                    : ""
                            }`}
                        >

                            <span></span>

                            {cameraActive
                                ? "LIVE"
                                : "STANDBY"}

                        </div>

                    </div>

                    <div className="fa-camera-area">

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`fa-video ${
                                cameraActive
                                    ? "show"
                                    : ""
                            }`}
                        />

                        {cameraActive && (
                            <>
                                <div className="fa-scan-frame">

                                    <div className="fa-corner fa-tl"></div>

                                    <div className="fa-corner fa-tr"></div>

                                    <div className="fa-corner fa-bl"></div>

                                    <div className="fa-corner fa-br"></div>

                                    <div className="fa-scan-line"></div>

                                </div>

                                <div className="fa-camera-label">
                                    Align face inside frame
                                </div>
                            </>
                        )}

                        {!cameraActive &&
                            !scanImage && (

                                <div className="fa-camera-placeholder">

                                    <div className="fa-placeholder-ring">
                                        <ScanFace size={42} />
                                    </div>

                                    <h3>
                                        Verification Standby
                                    </h3>

                                    <p>
                                        Start the camera to
                                        begin secure identity
                                        verification.
                                    </p>

                                </div>

                            )}

                        {scanImage &&
                            !cameraActive && (

                                <div className="fa-captured-preview">

                                    <img
                                        src={scanImage}
                                        alt="Authentication scan"
                                    />

                                    <div className="fa-captured-overlay">

                                        <CheckCircle2 size={15} />

                                        Scan Captured

                                    </div>

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

                        <div className="fa-error">

                            <AlertCircle size={18} />

                            <span>
                                {error}
                            </span>

                        </div>

                    )}

                    <div className="fa-camera-controls">

                        {!cameraActive && (

                            <button
                                type="button"
                                className="fa-primary-button"
                                onClick={
                                    startCamera
                                }
                                disabled={
                                    processing
                                }
                            >

                                <Camera size={18} />

                                Start Verification

                            </button>

                        )}

                        {cameraActive && (

                            <>

                                <button
                                    type="button"
                                    className="fa-primary-button"
                                    onClick={
                                        authenticateFace
                                    }
                                    disabled={
                                        processing
                                    }
                                >

                                    {processing ? (
                                        <>

                                            <Loader2
                                                size={18}
                                                className="fa-spin"
                                            />

                                            Verifying Identity...

                                        </>
                                    ) : (
                                        <>

                                            <ScanFace size={18} />

                                            Authenticate Face

                                        </>
                                    )}

                                </button>

                                <button
                                    type="button"
                                    className="fa-secondary-button"
                                    onClick={
                                        stopCamera
                                    }
                                    disabled={
                                        processing
                                    }
                                >

                                    <CameraOff
                                        size={18}
                                    />

                                    Stop

                                </button>

                            </>

                        )}

                        {!cameraActive &&
                            scanImage && (

                                <button
                                    type="button"
                                    className="fa-secondary-button fa-reset-button"
                                    onClick={
                                        resetScan
                                    }
                                >

                                    <RefreshCw size={17} />

                                    New Scan

                                </button>

                            )}

                    </div>

                </div>

                <div className="fa-result-card">

                    <div className="fa-card-top">

                        <div>

                            <span>
                                VERIFICATION RESULT
                            </span>

                            <h2>
                                Identity Status
                            </h2>

                        </div>

                        <ShieldCheck size={22} />

                    </div>

                    {!result && (

                        <div className="fa-awaiting">

                            <div className="fa-awaiting-icon">
                                <UserCheck size={34} />
                            </div>

                            <h3>
                                Awaiting Verification
                            </h3>

                            <p>
                                Your authentication result
                                will appear here after a
                                biometric scan.
                            </p>

                            <div className="fa-security-note">

                                <LockKeyhole size={15} />

                                Your face is compared
                                against registered
                                ArcFace embeddings.

                            </div>

                        </div>

                    )}

                    {result &&
                        result.recognized && (

                            <div className="fa-result-success">

                                <div className="fa-result-icon success">
                                    <UserCheck size={38} />
                                </div>

                                <span className="fa-result-label success-text">
                                    IDENTITY VERIFIED
                                </span>

                                <h3>
                                    {result.name}
                                </h3>

                                <p>
                                    Face matched with
                                    the authenticated
                                    identity.
                                </p>

                                <div className="fa-confidence-box">

                                    <div className="fa-confidence-head">

                                        <span>
                                            Match Confidence
                                        </span>

                                        <strong>
                                            {result.confidence.toFixed(
                                                2
                                            )}
                                            %
                                        </strong>

                                    </div>

                                    <div className="fa-confidence-track">

                                        <div
                                            className="fa-confidence-fill"
                                            style={{
                                                width: `${Math.min(
                                                    result.confidence,
                                                    100
                                                )}%`
                                            }}
                                        ></div>

                                    </div>

                                </div>

                                <div className="fa-verified-row">

                                    <CheckCircle2 size={17} />

                                    Secure authentication completed

                                </div>

                            </div>

                        )}

                    {result &&
                        !result.recognized &&
                        result.mismatch && (

                            <div className="fa-result-failed">

                                <div className="fa-result-icon failed">
                                    <UserX size={38} />
                                </div>

                                <span className="fa-result-label failed-text">
                                    IDENTITY MISMATCH
                                </span>

                                <h3>
                                    Account Verification Failed
                                </h3>

                                <p>
                                    The detected registered
                                    face does not belong to
                                    the currently logged-in
                                    account.
                                </p>

                                <div className="fa-confidence-box failed-box">

                                    <div className="fa-confidence-head">

                                        <span>
                                            Match Score
                                        </span>

                                        <strong>
                                            {result.confidence.toFixed(
                                                2
                                            )}
                                            %
                                        </strong>

                                    </div>

                                    <div className="fa-confidence-track">

                                        <div
                                            className="fa-confidence-fill failed-fill"
                                            style={{
                                                width: `${Math.min(
                                                    result.confidence,
                                                    100
                                                )}%`
                                            }}
                                        ></div>

                                    </div>

                                </div>

                                <div className="fa-warning-row">

                                    <AlertCircle size={17} />

                                    Another registered identity
                                    was detected

                                </div>

                            </div>

                        )}

                    {result &&
                        !result.recognized &&
                        !result.mismatch && (

                            <div className="fa-result-failed">

                                <div className="fa-result-icon failed">
                                    <UserX size={38} />
                                </div>

                                <span className="fa-result-label failed-text">
                                    VERIFICATION FAILED
                                </span>

                                <h3>
                                    Unknown Identity
                                </h3>

                                <p>
                                    No registered identity
                                    matched this face.
                                </p>

                                <div className="fa-confidence-box failed-box">

                                    <div className="fa-confidence-head">

                                        <span>
                                            Match Score
                                        </span>

                                        <strong>
                                            {result.confidence.toFixed(
                                                2
                                            )}
                                            %
                                        </strong>

                                    </div>

                                    <div className="fa-confidence-track">

                                        <div
                                            className="fa-confidence-fill failed-fill"
                                            style={{
                                                width: `${Math.min(
                                                    result.confidence,
                                                    100
                                                )}%`
                                            }}
                                        ></div>

                                    </div>

                                </div>

                                <div className="fa-warning-row">

                                    <AlertCircle size={17} />

                                    Access was not verified

                                </div>

                            </div>

                        )}

                </div>

            </div>

            <div className="fa-history-card">

                <div className="fa-history-header">

                    <div>

                        <span>
                            SECURITY ACTIVITY
                        </span>

                        <h2>
                            Recent Authentication
                        </h2>

                    </div>

                    <Activity size={21} />

                </div>

                {recentAuth.length === 0 ? (

                    <div className="fa-empty-history">

                        <Activity size={22} />

                        <span>
                            No authentication activity yet.
                        </span>

                    </div>

                ) : (

                    <div className="fa-history-list">

                        {recentAuth.map(
                            (activity) => {

                                const description =
                                    activity?.description ||
                                    "";

                                const isUnknown =
                                    description
                                        .toLowerCase()
                                        .includes(
                                            "unknown"
                                        );

                                const isMismatch =
                                    description
                                        .toLowerCase()
                                        .includes(
                                            "does not match"
                                        );

                                let displayName =
                                    "Verified User";

                                if (
                                    isUnknown
                                ) {
                                    displayName =
                                        "Unknown Identity";
                                } else if (
                                    isMismatch
                                ) {
                                    displayName =
                                        "Identity Mismatch";
                                } else if (
                                    activity.user &&
                                    typeof activity.user ===
                                        "object" &&
                                    activity.user.name
                                ) {
                                    displayName =
                                        activity.user.name;
                                } else if (
                                    description.includes(
                                        " was authenticated"
                                    )
                                ) {
                                    displayName =
                                        description.split(
                                            " was authenticated"
                                        )[0];
                                }

                                return (
                                    <div
                                        className="fa-history-row"
                                        key={
                                            activity._id
                                        }
                                    >

                                        <div
                                            className={`fa-history-status ${
                                                isUnknown ||
                                                isMismatch
                                                    ? "failed"
                                                    : "success"
                                            }`}
                                        >

                                            {isUnknown ||
                                            isMismatch ? (
                                                <UserX size={17} />
                                            ) : (
                                                <UserCheck size={17} />
                                            )}

                                        </div>

                                        <div className="fa-history-main">

                                            <strong>
                                                {
                                                    displayName
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    description
                                                }
                                            </span>

                                        </div>

                                        <time>
                                            {formatActivityTime(
                                                activity.createdAt
                                            )}
                                        </time>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </div>

        </div>
    );
}

export default FaceAuthentication;