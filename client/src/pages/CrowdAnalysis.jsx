import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Radar,
    Upload,
    Users,
    ShieldCheck,
    AlertTriangle,
    Camera,
    CameraOff
} from "lucide-react";
import toast from "react-hot-toast";

function CrowdAnalysis() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const intervalRef = useRef(null);
    const analyzingRef = useRef(false);

    const [mode, setMode] = useState("camera");
    const [cameraActive, setCameraActive] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [autoAnalysis, setAutoAnalysis] = useState(false);

    const [selectedImage, setSelectedImage] = useState(null);
    const [preview, setPreview] = useState("");

    const [result, setResult] = useState(null);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const saveActivityLog = async ({
        action,
        description,
        user = null,
        type = "System"
    }) => {
        try {
            await axios.post(
                "http://localhost:5000/api/activity-logs",
                {
                    action,
                    description,
                    user,
                    type
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    }
                }
            );
        } catch (error) {
            console.error(
                "Activity log error:",
                error
            );
        }
    };

    const startCamera = async () => {
        try {
            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {
                toast.error(
                    "Camera is not supported by this browser"
                );
                return;
            }

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

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                videoRef.current.onloadedmetadata =
                    async () => {
                        try {
                            await videoRef.current.play();

                            setVideoReady(true);
                            setCameraActive(true);

                            toast.success(
                                "Camera started"
                            );
                        } catch (error) {
                            console.error(error);

                            toast.error(
                                "Unable to start camera preview"
                            );
                        }
                    };
            }

            setResult(null);

        } catch (error) {
            console.error(error);

            if (
                error.name ===
                "NotAllowedError"
            ) {
                toast.error(
                    "Camera permission was denied. Allow camera access in your browser."
                );
            } else if (
                error.name ===
                "NotFoundError"
            ) {
                toast.error(
                    "No camera was found on this device"
                );
            } else {
                toast.error(
                    "Unable to access the camera"
                );
            }
        }
    };

    const stopCamera = () => {
        if (intervalRef.current) {
            clearInterval(
                intervalRef.current
            );

            intervalRef.current = null;
        }

        setAutoAnalysis(false);

        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
        setVideoReady(false);
        setAnalyzing(false);

        analyzingRef.current = false;
    };

    const captureFrame = () => {
        return new Promise(
            (resolve, reject) => {
                const video =
                    videoRef.current;

                const canvas =
                    canvasRef.current;

                if (!video || !canvas) {
                    reject(
                        new Error(
                            "Camera elements are not available"
                        )
                    );
                    return;
                }

                if (
                    !video.videoWidth ||
                    !video.videoHeight
                ) {
                    reject(
                        new Error(
                            "Camera video is not ready"
                        )
                    );
                    return;
                }

                canvas.width =
                    video.videoWidth;

                canvas.height =
                    video.videoHeight;

                const context =
                    canvas.getContext(
                        "2d"
                    );

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
                            reject(
                                new Error(
                                    "Unable to capture camera frame"
                                )
                            );

                            return;
                        }

                        resolve(blob);
                    },
                    "image/jpeg",
                    0.9
                );
            }
        );
    };

    const saveCrowdAnalysis = async (
        crowdData
    ) => {
        const token =
            localStorage.getItem(
                "token"
            );

        await axios.post(
            "http://localhost:5000/api/crowd",
            {
                totalFaces:
                    crowdData.total_faces,

                level: crowdData.level,

                message:
                    crowdData.message,

                detectedBoxes:
                    crowdData.boxes || []
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
    };

    const logCrowdActivity = async (
        crowdData,
        source
    ) => {
        const totalFaces =
            crowdData.total_faces ?? 0;

        const level =
            crowdData.level || "Unknown";

        const message =
            crowdData.message ||
            "Crowd analysis completed";

        await saveActivityLog({
            action: "Crowd Analysis",

            description:
                `${source} crowd analysis detected ${totalFaces} face${totalFaces !== 1 ? "s" : ""}. Crowd level: ${level}. ${message}`,

            user: null,

            type: "Crowd Analysis"
        });
    };

    const analyzeCamera = async (
        showToast = true
    ) => {
        if (
            !cameraActive ||
            !videoReady
        ) {
            if (showToast) {
                toast.error(
                    "Please wait for the camera preview to become ready"
                );
            }

            return;
        }

        if (analyzingRef.current) {
            return;
        }

        analyzingRef.current = true;
        setAnalyzing(true);

        try {
            const blob =
                await captureFrame();

            const formData =
                new FormData();

            formData.append(
                "image",
                blob,
                "camera-frame.jpg"
            );

            const response =
                await axios.post(
                    "http://127.0.0.1:8000/crowd-analyze",
                    formData
                );

            const crowdData =
                response.data;

            setResult(
                crowdData
            );

            await saveCrowdAnalysis(
                crowdData
            );

            await logCrowdActivity(
                crowdData,
                "Live camera"
            );

            if (showToast) {
                toast.success(
                    "Crowd analysis completed and saved"
                );
            }
        } catch (error) {
            console.error(error);

            if (showToast) {
                toast.error(
                    error.response?.data
                        ?.message ||
                    error.message ||
                    "Camera analysis failed"
                );
            }
        } finally {
            analyzingRef.current =
                false;

            setAnalyzing(false);
        }
    };

    const startAutoAnalysis = () => {
        if (
            !cameraActive ||
            !videoReady
        ) {
            toast.error(
                "Start the camera first"
            );

            return;
        }

        if (intervalRef.current) {
            return;
        }

        setAutoAnalysis(true);

        toast.success(
            "Real-time crowd analysis started"
        );

        analyzeCamera(false);

        intervalRef.current =
            setInterval(() => {
                analyzeCamera(false);
            }, 3000);
    };

    const stopAutoAnalysis = () => {
        if (intervalRef.current) {
            clearInterval(
                intervalRef.current
            );

            intervalRef.current = null;
        }

        setAutoAnalysis(false);

        toast.success(
            "Real-time analysis stopped"
        );
    };

    const handleImageChange = (
        event
    ) => {
        const file =
            event.target.files[0];

        if (!file) {
            return;
        }

        setSelectedImage(file);

        setPreview(
            URL.createObjectURL(file)
        );

        setResult(null);
    };

    const analyzeUploadedImage =
        async () => {
            if (!selectedImage) {
                toast.error(
                    "Please select an image first"
                );

                return;
            }

            setAnalyzing(true);

            try {
                const formData =
                    new FormData();

                formData.append(
                    "image",
                    selectedImage
                );

                const response =
                    await axios.post(
                        "http://127.0.0.1:8000/crowd-analyze",
                        formData
                    );

                const crowdData =
                    response.data;

                setResult(
                    crowdData
                );

                await saveCrowdAnalysis(
                    crowdData
                );

                await logCrowdActivity(
                    crowdData,
                    "Uploaded image"
                );

                toast.success(
                    "Crowd analysis completed and saved"
                );
            } catch (error) {
                console.error(error);

                toast.error(
                    error.response?.data
                        ?.message ||
                    "Crowd analysis failed"
                );
            } finally {
                setAnalyzing(false);
            }
        };

    const changeMode = (
        newMode
    ) => {
        if (newMode === mode) {
            return;
        }

        stopCamera();

        setSelectedImage(null);
        setPreview("");
        setResult(null);

        setMode(newMode);
    };

    return (
        <div className="page-container">

            <div className="page-header">

                <div>
                    <span className="page-kicker">
                        AI MONITORING
                    </span>

                    <h2>
                        Crowd Analysis
                    </h2>

                    <p>
                        Detect faces and analyze
                        crowd density using Deep Learning.
                    </p>
                </div>

                <div className="page-header-icon">
                    <Radar size={28} />
                </div>

            </div>

            <div className="analysis-mode-buttons">

                <button
                    className={
                        mode === "camera"
                            ? "mode-button active"
                            : "mode-button"
                    }
                    onClick={() =>
                        changeMode("camera")
                    }
                >
                    <Camera size={19} />
                    Live Camera
                </button>

                <button
                    className={
                        mode === "upload"
                            ? "mode-button active"
                            : "mode-button"
                    }
                    onClick={() =>
                        changeMode("upload")
                    }
                >
                    <Upload size={19} />
                    Upload Image
                </button>

            </div>

            <div className="analysis-grid">

                <div className="analysis-card">

                    {mode === "camera" ? (
                        <>
                            <div className="card-title">
                                <Camera size={20} />
                                <span>
                                    Live Camera
                                </span>
                            </div>

                            <div className="camera-container">

                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="crowd-camera"
                                    style={{
                                        display:
                                            cameraActive
                                                ? "block"
                                                : "none"
                                    }}
                                />

                                {!cameraActive && (
                                    <div className="camera-placeholder">

                                        <Camera size={50} />

                                        <h3>
                                            Camera Ready
                                        </h3>

                                        <p>
                                            Click Start Camera
                                            to activate your webcam.
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

                            <div className="camera-actions">

                                {!cameraActive ? (

                                    <button
                                        className="primary-button"
                                        onClick={
                                            startCamera
                                        }
                                    >
                                        <Camera size={19} />
                                        Start Camera
                                    </button>

                                ) : (

                                    <>
                                        {!autoAnalysis ? (

                                            <button
                                                className="primary-button"
                                                onClick={
                                                    startAutoAnalysis
                                                }
                                                disabled={
                                                    analyzing ||
                                                    !videoReady
                                                }
                                            >
                                                <Radar size={19} />

                                                Start Real-Time Analysis
                                            </button>

                                        ) : (

                                            <button
                                                className="secondary-button"
                                                onClick={
                                                    stopAutoAnalysis
                                                }
                                            >
                                                <Radar size={19} />

                                                Stop Real-Time Analysis
                                            </button>

                                        )}

                                        <button
                                            className="secondary-button"
                                            onClick={
                                                stopCamera
                                            }
                                        >
                                            <CameraOff size={19} />

                                            Stop Camera
                                        </button>

                                    </>

                                )}

                            </div>

                            {autoAnalysis && (
                                <div className="detection-summary">

                                    <span>
                                        ● Real-time analysis active
                                    </span>

                                    <span>
                                        Updating every 3 seconds
                                    </span>

                                </div>
                            )}

                        </>
                    ) : (

                        <>
                            <div className="card-title">

                                <Upload size={20} />

                                <span>
                                    Upload Crowd Image
                                </span>

                            </div>

                            <label className="upload-area">

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                        handleImageChange
                                    }
                                    hidden
                                />

                                {preview ? (

                                    <img
                                        src={preview}
                                        alt="Crowd preview"
                                        className="crowd-preview"
                                    />

                                ) : (

                                    <div className="upload-content">

                                        <Upload size={42} />

                                        <h3>
                                            Select an image
                                        </h3>

                                        <p>
                                            Upload an image
                                            containing one or
                                            more people.
                                        </p>

                                    </div>

                                )}

                            </label>

                            <button
                                className="primary-button"
                                onClick={
                                    analyzeUploadedImage
                                }
                                disabled={analyzing}
                            >
                                <Radar size={19} />

                                {analyzing
                                    ? "Analyzing..."
                                    : "Analyze Crowd"}

                            </button>

                        </>
                    )}

                </div>

                <div className="analysis-card">

                    <div className="card-title">

                        <ShieldCheck size={20} />

                        <span>
                            Analysis Result
                        </span>

                    </div>

                    {!result ? (

                        <div className="empty-analysis">

                            <Radar size={50} />

                            <h3>
                                No Analysis Yet
                            </h3>

                            <p>
                                Start the camera or
                                upload an image to
                                begin crowd analysis.
                            </p>

                        </div>

                    ) : (

                        <div className="crowd-results">

                            <div className="result-stat">

                                <Users size={24} />

                                <div>

                                    <span>
                                        Detected Faces
                                    </span>

                                    <strong>
                                        {result.total_faces}
                                    </strong>

                                </div>

                            </div>

                            <div className="result-stat">

                                <ShieldCheck size={24} />

                                <div>

                                    <span>
                                        Crowd Level
                                    </span>

                                    <strong>
                                        {result.level}
                                    </strong>

                                </div>

                            </div>

                            <div className="result-message">

                                <AlertTriangle size={22} />

                                <div>

                                    <strong>
                                        Crowd Status
                                    </strong>

                                    <p>
                                        {result.message}
                                    </p>

                                </div>

                            </div>

                            <div className="detection-summary">

                                <span>
                                    {result.total_faces} person
                                    {result.total_faces !== 1
                                        ? "s"
                                        : ""} detected
                                </span>

                                <span>
                                    Analysis saved to database
                                </span>

                            </div>

                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}

export default CrowdAnalysis;