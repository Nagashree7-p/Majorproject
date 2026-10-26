import { useEffect, useRef, useState } from "react";
import {
    Camera,
    CameraOff,
    ScanFace,
    UserCircle,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RotateCcw,
    Trash2,
    RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function FaceRegistration() {
    const { user } = useAuth();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [capturedImage, setCapturedImage] = useState("");
    const [capturedBlob, setCapturedBlob] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [alreadyRegistered, setAlreadyRegistered] = useState(false);
    const [error, setError] = useState("");

    const currentUserId =
        user?.id || user?._id;

    useEffect(() => {
        if (currentUserId) {
            checkFaceRegistration();
        }

        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }

            if (capturedImage) {
                URL.revokeObjectURL(capturedImage);
            }
        };
    }, [currentUserId]);

    const checkFaceRegistration = async () => {
        try {
            const token =
                localStorage.getItem("token");

            if (!token || !currentUserId) {
                return;
            }

            const response =
                await fetch(
                    `http://localhost:5000/api/faces/user/${currentUserId}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (response.ok) {
                setAlreadyRegistered(true);
            } else {
                setAlreadyRegistered(false);
            }
        } catch (error) {
            console.error(
                "Face registration status error:",
                error
            );
        }
    };

    const startCamera = async () => {
        try {
            setError("");

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

            const video =
                videoRef.current;

            if (!video) {
                throw new Error(
                    "Camera preview is unavailable"
                );
            }

            video.srcObject =
                stream;

            video.onloadedmetadata =
                async () => {
                    try {
                        await video.play();

                        setCameraActive(true);
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
                .forEach((track) =>
                    track.stop()
                );

            streamRef.current =
                null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject =
                null;
        }

        setCameraActive(false);
    };

    const captureFace = () => {
        const video =
            videoRef.current;

        const canvas =
            canvasRef.current;

        if (!video || !canvas) {
            toast.error(
                "Camera is not available"
            );
            return;
        }

        if (!cameraActive) {
            toast.error(
                "Start the camera first"
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

        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;

        const context =
            canvas.getContext("2d");

        if (!context) {
            toast.error(
                "Unable to capture image"
            );
            return;
        }

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    toast.error(
                        "Unable to capture image"
                    );
                    return;
                }

                const imageUrl =
                    URL.createObjectURL(
                        blob
                    );

                if (capturedImage) {
                    URL.revokeObjectURL(
                        capturedImage
                    );
                }

                setCapturedBlob(blob);
                setCapturedImage(imageUrl);
                setRegistered(false);
                setError("");

                stopCamera();

                toast.success(
                    "Face captured successfully"
                );
            },
            "image/jpeg",
            0.95
        );
    };

    const retakeFace = async () => {
        if (capturedImage) {
            URL.revokeObjectURL(
                capturedImage
            );
        }

        setCapturedImage("");
        setCapturedBlob(null);
        setRegistered(false);
        setError("");

        await startCamera();
    };

    const removeCapture = () => {
        if (capturedImage) {
            URL.revokeObjectURL(
                capturedImage
            );
        }

        setCapturedImage("");
        setCapturedBlob(null);
        setRegistered(false);
        setError("");
    };

    const deleteRegisteredFace = async () => {
        if (!currentUserId) {
            toast.error(
                "Unable to identify your account"
            );
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to delete your current face registration? You can register a new face afterwards."
            );

        if (!confirmed) {
            return;
        }

        try {
            setProcessing(true);
            setError("");

            const token =
                localStorage.getItem("token");

            if (!token) {
                throw new Error(
                    "Session expired. Please login again."
                );
            }

            const response =
                await fetch(
                    `http://localhost:5000/api/faces/user/${currentUserId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to delete face registration"
                );
            }

            setAlreadyRegistered(false);
            setRegistered(false);
            setCapturedImage("");
            setCapturedBlob(null);
            setError("");

            toast.success(
                "Face registration deleted successfully"
            );
        } catch (error) {
            console.error(
                "Delete face registration error:",
                error
            );

            setError(
                error.message ||
                    "Unable to delete face registration"
            );

            toast.error(
                error.message ||
                    "Unable to delete face registration"
            );
        } finally {
            setProcessing(false);
        }
    };

    const registerFace = async () => {
        if (!currentUserId) {
            toast.error(
                "Unable to identify the logged-in account"
            );
            return;
        }

        if (!capturedBlob) {
            toast.error(
                "Please capture a face first"
            );
            return;
        }

        try {
            setProcessing(true);
            setError("");

            const token =
                localStorage.getItem(
                    "token"
                );

            if (!token) {
                throw new Error(
                    "Session expired. Please login again."
                );
            }

            const formData =
                new FormData();

            formData.append(
                "image",
                capturedBlob,
                "face-registration.jpg"
            );

            const response =
                await fetch(
                    "http://localhost:5000/api/faces/register",
                    {
                        method: "POST",
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        },
                        body: formData
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Face registration failed"
                );
            }

            setRegistered(true);
            setAlreadyRegistered(true);

            toast.success(
                "Face registered successfully"
            );
        } catch (error) {
            console.error(
                "Face registration error:",
                error
            );

            setError(
                error.message ||
                    "Face registration failed"
            );

            toast.error(
                error.message ||
                    "Face registration failed"
            );
        } finally {
            setProcessing(false);
        }
    };

    const displayName =
        user?.name || "User";

    const displayEmail =
        user?.email || "";

    return (
        <div className="fr-page">

            <div className="fr-header">

                <div className="fr-header-left">

                    <div className="fr-icon-box">
                        <ScanFace size={24} />
                    </div>

                    <div>

                        <span>
                            BIOMETRIC MANAGEMENT
                        </span>

                        <h1>
                            Face Registration
                        </h1>

                        <p>
                            Register your face for
                            secure ArcFace authentication.
                        </p>

                    </div>

                </div>

                <div className="fr-ready">
                    <ShieldCheck size={17} />
                    ArcFace AI Ready
                </div>

            </div>

            <div className="fr-steps">

                <div className="fr-step active">
                    <b>01</b>
                    <span>Your Account</span>
                </div>

                <div className="fr-step-line"></div>

                <div
                    className={`fr-step ${
                        capturedImage
                            ? "active"
                            : ""
                    }`}
                >
                    <b>02</b>
                    <span>Capture Face</span>
                </div>

                <div className="fr-step-line"></div>

                <div
                    className={`fr-step ${
                        registered
                            ? "active"
                            : alreadyRegistered
                                ? "active"
                                : ""
                    }`}
                >
                    <b>03</b>
                    <span>Register</span>
                </div>

            </div>

            <div className="fr-grid">

                <div className="fr-camera-card">

                    <div className="fr-card-header">

                        <div>

                            <span>
                                BIOMETRIC CAPTURE
                            </span>

                            <h2>
                                Face Scanner
                            </h2>

                        </div>

                        <ScanFace size={21} />

                    </div>

                    <div className="fr-camera-area">

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`fr-video ${
                                cameraActive &&
                                !capturedImage
                                    ? "show"
                                    : ""
                            }`}
                        />

                        {cameraActive &&
                            !capturedImage && (

                            <div className="fr-frame">

                                <div className="fr-corner tl"></div>

                                <div className="fr-corner tr"></div>

                                <div className="fr-corner bl"></div>

                                <div className="fr-corner br"></div>

                                <span>
                                    Position your face
                                </span>

                            </div>

                        )}

                        {capturedImage && (

                            <div className="fr-captured">

                                <img
                                    src={
                                        capturedImage
                                    }
                                    alt="Captured face"
                                />

                                <div className="fr-captured-badge">

                                    <CheckCircle2
                                        size={14}
                                    />

                                    Face Captured

                                </div>

                            </div>

                        )}

                        {!cameraActive &&
                            !capturedImage && (

                            <div className="fr-placeholder">

                                <div className="fr-placeholder-icon">
                                    <Camera size={38} />
                                </div>

                                <h3>
                                    Camera Ready
                                </h3>

                                <p>
                                    Start the camera
                                    to capture one
                                    clear face image.
                                </p>

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

                        <div className="fr-error">

                            <AlertCircle size={18} />

                            <span>
                                {error}
                            </span>

                        </div>

                    )}

                    <div className="fr-camera-buttons">

                        {!cameraActive &&
                            !capturedImage &&
                            !alreadyRegistered && (

                            <button
                                type="button"
                                className="fr-primary"
                                onClick={
                                    startCamera
                                }
                                disabled={
                                    processing
                                }
                            >

                                <Camera size={18} />

                                Start Camera

                            </button>

                        )}

                        {cameraActive && (

                            <>

                                <button
                                    type="button"
                                    className="fr-primary"
                                    onClick={
                                        captureFace
                                    }
                                    disabled={
                                        processing
                                    }
                                >

                                    <ScanFace size={18} />

                                    Capture Face

                                </button>

                                <button
                                    type="button"
                                    className="fr-secondary"
                                    onClick={
                                        stopCamera
                                    }
                                    disabled={
                                        processing
                                    }
                                >

                                    <CameraOff size={18} />

                                    Stop Camera

                                </button>

                            </>

                        )}

                        {capturedImage &&
                            !registered && (

                            <button
                                type="button"
                                className="fr-primary"
                                onClick={
                                    retakeFace
                                }
                                disabled={
                                    processing
                                }
                            >

                                <Camera size={18} />

                                Retake Face

                            </button>

                        )}

                    </div>

                    {capturedImage &&
                        !registered && (

                        <button
                            type="button"
                            className="fr-remove"
                            onClick={
                                removeCapture
                            }
                            disabled={
                                processing
                            }
                        >

                            <RotateCcw size={15} />

                            Remove Capture

                        </button>

                    )}

                </div>

                <div className="fr-details-card">

                    <div className="fr-card-header">

                        <div>

                            <span>
                                YOUR ACCOUNT
                            </span>

                            <h2>
                                Register My Face
                            </h2>

                        </div>

                        <UserCircle size={21} />

                    </div>

                    <div className="fr-user">

                        <div className="fr-user-avatar">

                            {displayName
                                .charAt(0)
                                .toUpperCase()}

                        </div>

                        <div>

                            <span>
                                LOGGED-IN ACCOUNT
                            </span>

                            <strong>
                                {displayName}
                            </strong>

                            <p>
                                {displayEmail}
                            </p>

                        </div>

                        <ShieldCheck
                            size={19}
                        />

                    </div>

                    {alreadyRegistered && (

                        <div className="fr-success">

                            <CheckCircle2 size={31} />

                            <div>

                                <strong>
                                    Face Already Registered
                                </strong>

                                <p>
                                    Your face is currently
                                    linked to this account.
                                </p>

                            </div>

                        </div>

                    )}

                    <div className="fr-guidelines">

                        <h3>

                            <ShieldCheck size={16} />

                            Capture Guidelines

                        </h3>

                        <div>

                            <CheckCircle2 size={15} />

                            One face should be visible

                        </div>

                        <div>

                            <CheckCircle2 size={15} />

                            Keep your face centered

                        </div>

                        <div>

                            <CheckCircle2 size={15} />

                            Use good lighting

                        </div>

                        <div>

                            <CheckCircle2 size={15} />

                            Look directly at camera

                        </div>

                    </div>

                    {alreadyRegistered ? (

                        <button
                            type="button"
                            className="fr-register"
                            onClick={
                                deleteRegisteredFace
                            }
                            disabled={
                                processing
                            }
                        >

                            {processing ? (

                                <>

                                    <Loader2
                                        size={18}
                                        className="fr-spin"
                                    />

                                    Removing Face...

                                </>

                            ) : (

                                <>

                                    <Trash2 size={18} />

                                    Delete Current Face

                                </>

                            )}

                        </button>

                    ) : registered ? (

                        <div className="fr-success">

                            <CheckCircle2 size={31} />

                            <div>

                                <strong>
                                    Face Registered Successfully
                                </strong>

                                <p>
                                    Your ArcFace embedding
                                    has been stored successfully.
                                </p>

                            </div>

                        </div>

                    ) : (

                        <button
                            type="button"
                            className="fr-register"
                            onClick={
                                registerFace
                            }
                            disabled={
                                processing ||
                                !capturedBlob
                            }
                        >

                            {processing ? (

                                <>

                                    <Loader2
                                        size={18}
                                        className="fr-spin"
                                    />

                                    Processing Face...

                                </>

                            ) : (

                                <>

                                    <ShieldCheck
                                        size={18}
                                    />

                                    Register My Face

                                </>

                            )}

                        </button>

                    )}

                    {alreadyRegistered && (

                        <div
                            style={{
                                marginTop: "12px",
                                padding: "11px 13px",
                                borderRadius: "11px",
                                background:
                                    "rgba(91, 77, 220, 0.08)",
                                border:
                                    "1px solid rgba(120, 105, 240, 0.15)",
                                color: "#858fa8",
                                fontSize: "11px",
                                lineHeight: "1.5"
                            }}
                        >
                            <RefreshCw
                                size={14}
                                style={{
                                    verticalAlign:
                                        "middle",
                                    marginRight:
                                        "6px"
                                }}
                            />
                            Delete your current
                            registration to capture
                            and register a new face.
                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default FaceRegistration;