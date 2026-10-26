import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
    ClipboardCheck,
    Search,
    RefreshCw,
    CalendarCheck2,
    ScanFace,
    ShieldCheck,
    Clock3,
    TrendingUp,
    UserCheck,
    CircleCheck,
    Fingerprint,
    ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Attendance() {
    const { user } = useAuth();

    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const isAdmin =
        String(user?.role || "user").toLowerCase() ===
        "admin";

    const currentUserId =
        user?.id || user?._id;

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            setError("");

            const token =
                localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/attendance",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            const allAttendance =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            if (isAdmin) {
                setAttendance(
                    allAttendance
                );
            } else {
                const myAttendance =
                    allAttendance.filter(
                        (record) => {
                            let recordUserId =
                                null;

                            if (
                                typeof record.user ===
                                "object"
                            ) {
                                recordUserId =
                                    record.user?._id ||
                                    record.user?.id ||
                                    null;
                            } else {
                                recordUserId =
                                    record.user ||
                                    null;
                            }

                            return (
                                String(recordUserId) ===
                                String(currentUserId)
                            );
                        }
                    );

                setAttendance(
                    myAttendance
                );
            }
        } catch (err) {
            console.error(
                "Attendance error:",
                err
            );

            setError(
                "Unable to load attendance records."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAttendance();
        }
    }, [user]);

    const filteredAttendance = useMemo(() => {
        return attendance.filter(
            (record) =>
                `${record.name || ""} ${
                    record.method || ""
                } ${
                    record.status || ""
                } ${
                    record.date || ""
                }`
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
        );
    }, [attendance, search]);

    const presentCount =
        attendance.filter(
            (item) =>
                item.status === "Present"
        ).length;

    const faceAuthenticationCount =
        attendance.filter(
            (item) =>
                item.method ===
                "Individual Face"
        ).length;

    const groupAuthenticationCount =
        attendance.filter(
            (item) =>
                item.method ===
                "Group Face"
        ).length;

    const todayCount =
        attendance.filter(
            (item) => {
                const value =
                    item.createdAt ||
                    item.date;

                if (!value) {
                    return false;
                }

                const date =
                    new Date(value);

                if (
                    isNaN(
                        date.getTime()
                    )
                ) {
                    return false;
                }

                const today =
                    new Date();

                return (
                    date.getFullYear() ===
                        today.getFullYear() &&
                    date.getMonth() ===
                        today.getMonth() &&
                    date.getDate() ===
                        today.getDate()
                );
            }
        ).length;

    const latestAttendance =
        attendance.length > 0
            ? attendance[0]
            : null;

    const averageConfidence =
        attendance.length > 0
            ? (
                attendance.reduce(
                    (
                        total,
                        record
                    ) =>
                        total +
                        Number(
                            record.confidence ||
                                0
                        ),
                    0
                ) /
                attendance.length
            ).toFixed(2)
            : "0.00";

    const formatDate = (value) => {
        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            !isNaN(
                date.getTime()
            ) &&
            String(value).includes("T")
        ) {
            return date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            );
        }

        return String(value);
    };

    const getInitial =
        user?.name
            ?.charAt(0)
            ?.toUpperCase() ||
        "U";

    return (
        <div className="attendance-modern-page">

            <div className="attendance-modern-header">

                <div className="attendance-header-left">

                    <div className="attendance-title-icon">
                        <ClipboardCheck size={27} />
                    </div>

                    <div>

                        <span className="attendance-eyebrow">
                            {isAdmin
                                ? "ATTENDANCE MANAGEMENT"
                                : "PERSONAL ATTENDANCE"}
                        </span>

                        <h1>
                            {isAdmin
                                ? "Attendance"
                                : "My Attendance"}
                        </h1>

                        <p>
                            {isAdmin
                                ? "Monitor face authentication attendance across the FaceGuard AI system."
                                : "Track your biometric authentication and attendance history."
                            }
                        </p>

                    </div>

                </div>

                <div className="attendance-header-actions">

                    <div className="attendance-secure-pill">
                        <ShieldCheck size={16} />
                        Secure Records
                    </div>

                    <button
                        className="attendance-refresh-btn"
                        onClick={
                            fetchAttendance
                        }
                        disabled={
                            loading
                        }
                    >

                        <RefreshCw
                            size={17}
                            className={
                                loading
                                    ? "attendance-spin"
                                    : ""
                            }
                        />

                        Refresh

                    </button>

                </div>

            </div>

            {!isAdmin && (

                <div className="attendance-profile-banner">

                    <div className="attendance-profile-avatar">
                        {getInitial}
                    </div>

                    <div className="attendance-profile-info">

                        <span>
                            LOGGED-IN ACCOUNT
                        </span>

                        <strong>
                            {user?.name ||
                                "User"}
                        </strong>

                        <p>
                            {user?.email ||
                                ""}
                        </p>

                    </div>

                    <div className="attendance-profile-status">

                        <CircleCheck
                            size={18}
                        />

                        Personal records only

                    </div>

                </div>

            )}

            <div className="attendance-modern-stats">

                <div className="attendance-stat-card purple">

                    <div className="attendance-stat-icon">
                        <CalendarCheck2 size={22} />
                    </div>

                    <div className="attendance-stat-content">

                        <span>
                            {isAdmin
                                ? "Total Records"
                                : "My Records"}
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : attendance.length}
                        </strong>

                        <small>
                            All stored attendance
                        </small>

                    </div>

                    <div className="attendance-stat-arrow">
                        <ChevronRight size={18} />
                    </div>

                </div>

                <div className="attendance-stat-card green">

                    <div className="attendance-stat-icon">
                        <UserCheck size={22} />
                    </div>

                    <div className="attendance-stat-content">

                        <span>
                            Present
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : presentCount}
                        </strong>

                        <small>
                            Successful attendance
                        </small>

                    </div>

                    <div className="attendance-stat-arrow">
                        <ChevronRight size={18} />
                    </div>

                </div>

                <div className="attendance-stat-card blue">

                    <div className="attendance-stat-icon">
                        <ScanFace size={22} />
                    </div>

                    <div className="attendance-stat-content">

                        <span>
                            Face Authentication
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : faceAuthenticationCount}
                        </strong>

                        <small>
                            Individual verification
                        </small>

                    </div>

                    <div className="attendance-stat-arrow">
                        <ChevronRight size={18} />
                    </div>

                </div>

                <div className="attendance-stat-card orange">

                    <div className="attendance-stat-icon">
                        <TrendingUp size={22} />
                    </div>

                    <div className="attendance-stat-content">

                        <span>
                            Avg. Confidence
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : `${averageConfidence}%`}
                        </strong>

                        <small>
                            Recognition confidence
                        </small>

                    </div>

                    <div className="attendance-stat-arrow">
                        <ChevronRight size={18} />
                    </div>

                </div>

            </div>

            <div className="attendance-overview-grid">

                <div className="attendance-overview-card">

                    <div className="attendance-overview-icon">
                        <Clock3 size={21} />
                    </div>

                    <div>

                        <span>
                            TODAY
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : todayCount}
                        </strong>

                        <p>
                            Attendance records today
                        </p>

                    </div>

                </div>

                <div className="attendance-overview-card">

                    <div className="attendance-overview-icon">
                        <Fingerprint size={21} />
                    </div>

                    <div>

                        <span>
                            GROUP AUTHENTICATION
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : groupAuthenticationCount}
                        </strong>

                        <p>
                            Records created through group recognition
                        </p>

                    </div>

                </div>

                <div className="attendance-overview-card">

                    <div className="attendance-overview-icon">
                        <ShieldCheck size={21} />
                    </div>

                    <div>

                        <span>
                            RECORD SECURITY
                        </span>

                        <strong>
                            Protected
                        </strong>

                        <p>
                            Attendance access is role-controlled
                        </p>

                    </div>

                </div>

            </div>

            <div className="attendance-modern-card">

                <div className="attendance-record-header">

                    <div>

                        <span className="attendance-section-eyebrow">
                            ATTENDANCE HISTORY
                        </span>

                        <h2>
                            {isAdmin
                                ? "Attendance Records"
                                : "My Attendance Records"}
                        </h2>

                        <p>
                            {isAdmin
                                ? "All biometric attendance events stored in MongoDB."
                                : "Your biometric attendance events stored securely in MongoDB."
                            }
                        </p>

                    </div>

                    <div className="attendance-search-wrapper">

                        <Search size={18} />

                        <input
                            type="text"
                            placeholder={
                                isAdmin
                                    ? "Search records..."
                                    : "Search my records..."
                            }
                            value={
                                search
                            }
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>

                {loading ? (

                    <div className="attendance-empty-modern">

                        <div className="attendance-loading-icon">

                            <RefreshCw
                                size={34}
                                className="attendance-spin"
                            />

                        </div>

                        <h3>
                            Loading attendance
                        </h3>

                        <p>
                            Fetching secure attendance records...
                        </p>

                    </div>

                ) : error ? (

                    <div className="attendance-empty-modern">

                        <div className="attendance-loading-icon error">
                            <ClipboardCheck size={34} />
                        </div>

                        <h3>
                            Unable to load attendance
                        </h3>

                        <p>
                            {error}
                        </p>

                        <button
                            className="attendance-retry-btn"
                            onClick={
                                fetchAttendance
                            }
                        >

                            <RefreshCw size={17} />

                            Try Again

                        </button>

                    </div>

                ) : filteredAttendance.length === 0 ? (

                    <div className="attendance-empty-modern">

                        <div className="attendance-loading-icon">

                            <ClipboardCheck
                                size={34}
                            />

                        </div>

                        <h3>
                            {search
                                ? "No matching records"
                                : isAdmin
                                    ? "No attendance records yet"
                                    : "No attendance records for your account"}
                        </h3>

                        <p>
                            {search
                                ? "Try a different search term."
                                : "Successful biometric attendance records will appear here automatically."
                            }
                        </p>

                    </div>

                ) : (

                    <div className="attendance-table-container">

                        <table className="attendance-modern-table">

                            <thead>

                                <tr>

                                    <th>
                                        PERSON
                                    </th>

                                    <th>
                                        DATE
                                    </th>

                                    <th>
                                        TIME
                                    </th>

                                    <th>
                                        STATUS
                                    </th>

                                    <th>
                                        METHOD
                                    </th>

                                    <th>
                                        CONFIDENCE
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredAttendance.map(
                                    (record) => {

                                        const confidence =
                                            Number(
                                                record.confidence ||
                                                    0
                                            );

                                        const isGroup =
                                            record.method ===
                                            "Group Face";

                                        return (
                                            <tr
                                                key={
                                                    record._id
                                                }
                                            >

                                                <td>

                                                    <div className="attendance-person">

                                                        <div className="attendance-person-avatar">

                                                            {(
                                                                record.name ||
                                                                "U"
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()}

                                                        </div>

                                                        <div>

                                                            <strong>
                                                                {
                                                                    record.name ||
                                                                    "Unknown"
                                                                }
                                                            </strong>

                                                            <span>
                                                                Biometric identity
                                                            </span>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="attendance-date-cell">

                                                        <CalendarCheck2 size={15} />

                                                        <span>
                                                            {
                                                                formatDate(
                                                                    record.date
                                                                )
                                                            }
                                                        </span>

                                                    </div>

                                                </td>

                                                <td>

                                                    <div className="attendance-time-cell">

                                                        <Clock3 size={14} />

                                                        <span>
                                                            {
                                                                record.time ||
                                                                "—"
                                                            }
                                                        </span>

                                                    </div>

                                                </td>

                                                <td>

                                                    <span className="attendance-status-badge">

                                                        <span></span>

                                                        {
                                                            record.status ||
                                                            "Present"
                                                        }

                                                    </span>

                                                </td>

                                                <td>

                                                    <span
                                                        className={`attendance-method-badge ${
                                                            isGroup
                                                                ? "group"
                                                                : "individual"
                                                        }`}
                                                    >

                                                        {isGroup ? (
                                                            <UsersIcon />
                                                        ) : (
                                                            <ScanFace
                                                                size={14}
                                                            />
                                                        )}

                                                        {
                                                            record.method ||
                                                            "—"
                                                        }

                                                    </span>

                                                </td>

                                                <td>

                                                    <div className="attendance-confidence">

                                                        <div className="attendance-confidence-top">

                                                            <span>
                                                                Match
                                                            </span>

                                                            <strong>
                                                                {confidence.toFixed(
                                                                    2
                                                                )}
                                                                %
                                                            </strong>

                                                        </div>

                                                        <div className="attendance-confidence-track">

                                                            <div
                                                                className="attendance-confidence-fill"
                                                                style={{
                                                                    width: `${Math.min(
                                                                        confidence,
                                                                        100
                                                                    )}%`
                                                                }}
                                                            ></div>

                                                        </div>

                                                    </div>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {latestAttendance && !loading && (

                <div className="attendance-latest-card">

                    <div className="attendance-latest-icon">
                        <CheckCircle2Icon />
                    </div>

                    <div className="attendance-latest-content">

                        <span>
                            LATEST ATTENDANCE
                        </span>

                        <strong>
                            {latestAttendance.name ||
                                user?.name ||
                                "User"}
                        </strong>

                        <p>
                            {latestAttendance.date ||
                                "—"}{" "}
                            •{" "}
                            {latestAttendance.time ||
                                "—"}{" "}
                            •{" "}
                            {latestAttendance.method ||
                                "Face Authentication"}
                        </p>

                    </div>

                    <div className="attendance-latest-confidence">

                        <span>
                            CONFIDENCE
                        </span>

                        <strong>
                            {Number(
                                latestAttendance.confidence ||
                                    0
                            ).toFixed(2)}
                            %
                        </strong>

                    </div>

                </div>

            )}

        </div>
    );
}

function UsersIcon() {
    return (
        <span
            style={{
                fontSize: "12px",
                fontWeight: "800"
            }}
        >
            G
        </span>
    );
}

function CheckCircle2Icon() {
    return (
        <CircleCheck
            size={28}
        />
    );
}

export default Attendance;