import { useEffect, useState } from "react";
import {
    ScanFace,
    Users,
    UserCheck,
    ShieldCheck,
    Activity,
    TrendingUp,
    Radar,
    ClipboardCheck,
    ArrowUpRight,
    Clock3,
    UserRoundPlus,
    LockKeyhole,
    CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
    const { user } = useAuth();

    const [stats, setStats] = useState({
        totalUsers: 0,
        todayAttendance: 0,
        recognizedFaces: 0,
        crowdSessions: 0,
        myActivities: 0,
        faceRegistered: false
    });

    const [recentActivities, setRecentActivities] = useState([]);
    const [latestCrowd, setLatestCrowd] = useState(null);
    const [lastAttendance, setLastAttendance] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAdmin =
        String(user?.role || "user").toLowerCase() === "admin";

    useEffect(() => {
        if (user?.id || user?._id) {
            loadDashboardData();
        }
    }, [user]);

    const getRecordUserId = (record) => {
        if (!record?.user) {
            return null;
        }

        if (typeof record.user === "object") {
            return record.user._id || record.user.id || null;
        }

        return record.user;
    };

    const belongsToCurrentUser = (record) => {
        const currentUserId =
            user?.id || user?._id;

        return (
            getRecordUserId(record) ===
            currentUserId
        );
    };

    const isToday = (value) => {
        if (!value) {
            return false;
        }

        const date = new Date(value);

        if (isNaN(date.getTime())) {
            return false;
        }

        const today = new Date();

        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const currentUserId =
                user?.id || user?._id;

            if (!token || !currentUserId) {
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`
            };

            if (isAdmin) {
                const [
                    usersResponse,
                    attendanceResponse,
                    crowdResponse,
                    activityResponse
                ] = await Promise.all([
                    fetch(
                        "http://localhost:5000/api/users",
                        { headers }
                    ),
                    fetch(
                        "http://localhost:5000/api/attendance",
                        { headers }
                    ),
                    fetch(
                        "http://localhost:5000/api/crowd",
                        { headers }
                    ),
                    fetch(
                        "http://localhost:5000/api/activity-logs",
                        { headers }
                    )
                ]);

                const users = usersResponse.ok
                    ? await usersResponse.json()
                    : [];

                const attendance =
                    attendanceResponse.ok
                        ? await attendanceResponse.json()
                        : [];

                const crowd =
                    crowdResponse.ok
                        ? await crowdResponse.json()
                        : [];

                const activities =
                    activityResponse.ok
                        ? await activityResponse.json()
                        : [];

                const todayAttendance =
                    attendance.filter(
                        (record) =>
                            isToday(
                                record.createdAt ||
                                record.date
                            )
                    ).length;

                const recognizedFaces =
                    attendance.filter(
                        (record) =>
                            record.status === "Present" ||
                            record.recognized === true
                    ).length;

                setStats({
                    totalUsers: Array.isArray(users)
                        ? users.length
                        : 0,

                    todayAttendance,

                    recognizedFaces,

                    crowdSessions: Array.isArray(crowd)
                        ? crowd.length
                        : 0,

                    myActivities: Array.isArray(activities)
                        ? activities.length
                        : 0,

                    faceRegistered: false
                });

                setRecentActivities(
                    Array.isArray(activities)
                        ? activities.slice(0, 5)
                        : []
                );

                if (
                    Array.isArray(crowd) &&
                    crowd.length > 0
                ) {
                    setLatestCrowd(crowd[0]);
                }

                return;
            }

            const [
                attendanceResponse,
                activityResponse,
                faceResponse
            ] = await Promise.all([
                fetch(
                    "http://localhost:5000/api/attendance",
                    { headers }
                ),
                fetch(
                    "http://localhost:5000/api/activity-logs",
                    { headers }
                ),
                fetch(
                    `http://localhost:5000/api/faces/user/${currentUserId}`,
                    { headers }
                )
            ]);

            const attendance =
                attendanceResponse.ok
                    ? await attendanceResponse.json()
                    : [];

            const activities =
                activityResponse.ok
                    ? await activityResponse.json()
                    : [];

            let faceData = null;

            if (faceResponse.ok) {
                faceData =
                    await faceResponse.json();
            }

            const myAttendance =
                Array.isArray(attendance)
                    ? attendance.filter(
                        (record) =>
                            belongsToCurrentUser(record)
                    )
                    : [];

            const myActivities =
                Array.isArray(activities)
                    ? activities.filter(
                        (activity) =>
                            belongsToCurrentUser(activity)
                    )
                    : [];

            const todayAttendance =
                myAttendance.filter(
                    (record) =>
                        isToday(
                            record.createdAt ||
                            record.date
                        )
                ).length;

            const recognizedFaces =
                myAttendance.filter(
                    (record) =>
                        record.status === "Present" ||
                        record.recognized === true
                ).length;

            setStats({
                totalUsers: 0,
                todayAttendance,
                recognizedFaces,
                crowdSessions: 0,
                myActivities: myActivities.length,
                faceRegistered: Boolean(faceData)
            });

            setRecentActivities(
                myActivities.slice(0, 5)
            );

            if (myAttendance.length > 0) {
                setLastAttendance(
                    myAttendance[0]
                );
            } else {
                setLastAttendance(null);
            }
        } catch (error) {
            console.error(
                "Dashboard loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (action) => {
        const value = String(
            action || ""
        ).toLowerCase();

        if (value.includes("crowd")) {
            return <Radar size={18} />;
        }

        if (value.includes("attendance")) {
            return <ClipboardCheck size={18} />;
        }

        if (value.includes("face")) {
            return <ScanFace size={18} />;
        }

        if (value.includes("login")) {
            return <ShieldCheck size={18} />;
        }

        return <Activity size={18} />;
    };

    const getActivityText = (activity) => {
        return (
            activity?.action ||
            activity?.activity ||
            activity?.type ||
            "System Activity"
        );
    };

    const getActivityDescription = (activity) => {
        return (
            activity?.description ||
            activity?.message ||
            "Activity recorded"
        );
    };

    const formatActivityTime = (activity) => {
        const dateValue =
            activity?.createdAt ||
            activity?.timestamp ||
            activity?.date;

        if (!dateValue) {
            return "Now";
        }

        const date = new Date(dateValue);

        if (isNaN(date.getTime())) {
            return "Now";
        }

        return date.toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    };

    if (!user) {
        return null;
    }

    return (
        <div className="dashboard-page">

            <div className="dashboard-header">

                <div>

                    <p className="dashboard-label">
                        FACEGUARD AI
                    </p>

                    <h1>
                        Welcome back,{" "}
                        {user.name || "User"} 👋
                    </h1>

                    <p>
                        {isAdmin
                            ? "Monitor and manage your intelligent security system."
                            : "Manage your personal biometric security and attendance."
                        }
                    </p>

                </div>

                <div className="dashboard-status">
                    <span></span>
                    System Online
                </div>

            </div>

            {isAdmin ? (

                <>
                    <div className="dashboard-stats">

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <Users size={25} />
                            </div>

                            <div>
                                <span>
                                    Total Users
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.totalUsers}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <UserCheck size={25} />
                            </div>

                            <div>
                                <span>
                                    Today's Attendance
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.todayAttendance}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <ScanFace size={25} />
                            </div>

                            <div>
                                <span>
                                    Recognized Faces
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.recognizedFaces}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <Radar size={25} />
                            </div>

                            <div>
                                <span>
                                    Crowd Sessions
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.crowdSessions}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                    </div>

                    <div className="dashboard-content">

                        <div className="dashboard-main-card">

                            <div className="card-title">

                                <div>
                                    <h2>
                                        AI Monitoring Overview
                                    </h2>

                                    <p>
                                        Real-time system intelligence
                                    </p>
                                </div>

                                <Activity size={22} />

                            </div>

                            <div className="monitoring-box">

                                <div className="monitoring-icon">
                                    <ScanFace size={42} />
                                </div>

                                <div className="monitoring-live-badge">
                                    <span></span>
                                    AI ENGINE READY
                                </div>

                                <h3>
                                    Ready for Analysis
                                </h3>

                                <p>
                                    Start face authentication,
                                    group recognition, or crowd
                                    analysis from the sidebar.
                                </p>

                                <div className="monitoring-actions">

                                    <Link
                                        to="/face-authentication"
                                        className="monitoring-action"
                                    >
                                        <ScanFace size={17} />
                                        Face Scan
                                    </Link>

                                    <Link
                                        to="/group-authentication"
                                        className="monitoring-action secondary"
                                    >
                                        <Users size={17} />
                                        Group Scan
                                    </Link>

                                    <Link
                                        to="/crowd-analysis"
                                        className="monitoring-action secondary"
                                    >
                                        <Radar size={17} />
                                        Crowd Analysis
                                    </Link>

                                </div>

                            </div>

                        </div>

                        <div className="dashboard-side-card">

                            <div className="card-title">

                                <div>
                                    <h2>
                                        Quick Stats
                                    </h2>

                                    <p>
                                        System intelligence
                                    </p>
                                </div>

                                <TrendingUp size={22} />

                            </div>

                            <div className="quick-stat">

                                <span>
                                    Recognition Records
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.recognizedFaces}
                                </strong>

                            </div>

                            <div className="progress">

                                <div
                                    style={{
                                        width:
                                            stats.recognizedFaces > 0
                                                ? "100%"
                                                : "8%"
                                    }}
                                ></div>

                            </div>

                            <div className="quick-stat">

                                <span>
                                    Today's Attendance
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.todayAttendance}
                                </strong>

                            </div>

                            <div className="progress">

                                <div
                                    style={{
                                        width:
                                            stats.todayAttendance > 0
                                                ? "100%"
                                                : "8%"
                                    }}
                                ></div>

                            </div>

                            <div className="quick-stat">

                                <span>
                                    AI Engine
                                </span>

                                <strong className="online-text">
                                    Online
                                </strong>

                            </div>

                            {latestCrowd && (
                                <div className="latest-crowd">

                                    <div className="latest-crowd-icon">
                                        <Radar size={17} />
                                    </div>

                                    <div>

                                        <span>
                                            Latest Crowd Level
                                        </span>

                                        <strong>
                                            {latestCrowd.level ||
                                                "Unknown"}
                                        </strong>

                                    </div>

                                </div>
                            )}

                        </div>

                    </div>
                </>

            ) : (

                <>
                    <div className="dashboard-stats">

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <ScanFace size={25} />
                            </div>

                            <div>
                                <span>
                                    Face Status
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.faceRegistered
                                            ? "Registered"
                                            : "Not Set"}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <UserCheck size={25} />
                            </div>

                            <div>
                                <span>
                                    Today's Attendance
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.todayAttendance}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <Activity size={25} />
                            </div>

                            <div>
                                <span>
                                    My Recognitions
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.recognizedFaces}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                        <div className="dashboard-stat-card">

                            <div className="stat-icon">
                                <ClipboardCheck size={25} />
                            </div>

                            <div>
                                <span>
                                    My Activities
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.myActivities}
                                </strong>
                            </div>

                            <ArrowUpRight
                                className="stat-card-arrow"
                                size={18}
                            />

                        </div>

                    </div>

                    <div className="dashboard-content">

                        <div className="dashboard-main-card">

                            <div className="card-title">

                                <div>
                                    <h2>
                                        My Security Center
                                    </h2>

                                    <p>
                                        Your personal FaceGuard AI services
                                    </p>
                                </div>

                                <ShieldCheck size={22} />

                            </div>

                            <div className="monitoring-box">

                                <div className="monitoring-icon">
                                    <ShieldCheck size={42} />
                                </div>

                                <div className="monitoring-live-badge">
                                    <span></span>
                                    PERSONAL SECURITY
                                </div>

                                <h3>
                                    Your account is protected
                                </h3>

                                <p>
                                    Use face authentication and
                                    face registration to manage
                                    your biometric identity.
                                </p>

                                <div className="monitoring-actions">

                                    <Link
                                        to="/face-authentication"
                                        className="monitoring-action"
                                    >
                                        <ScanFace size={17} />
                                        Verify My Face
                                    </Link>

                                    <Link
                                        to="/face-registration"
                                        className="monitoring-action secondary"
                                    >
                                        <UserRoundPlus size={17} />
                                        Register My Face
                                    </Link>

                                    <Link
                                        to="/attendance"
                                        className="monitoring-action secondary"
                                    >
                                        <ClipboardCheck size={17} />
                                        My Attendance
                                    </Link>

                                </div>

                            </div>

                        </div>

                        <div className="dashboard-side-card">

                            <div className="card-title">

                                <div>
                                    <h2>
                                        My Security
                                    </h2>

                                    <p>
                                        Personal account status
                                    </p>
                                </div>

                                <LockKeyhole size={22} />

                            </div>

                            <div className="quick-stat">

                                <span>
                                    Face Registration
                                </span>

                                <strong
                                    className={
                                        stats.faceRegistered
                                            ? "online-text"
                                            : ""
                                    }
                                >
                                    {loading
                                        ? "..."
                                        : stats.faceRegistered
                                            ? "Complete"
                                            : "Pending"}
                                </strong>

                            </div>

                            <div className="progress">

                                <div
                                    style={{
                                        width:
                                            stats.faceRegistered
                                                ? "100%"
                                                : "8%"
                                    }}
                                ></div>

                            </div>

                            <div className="quick-stat">

                                <span>
                                    Today's Attendance
                                </span>

                                <strong>
                                    {loading
                                        ? "..."
                                        : stats.todayAttendance}
                                </strong>

                            </div>

                            <div className="progress">

                                <div
                                    style={{
                                        width:
                                            stats.todayAttendance > 0
                                                ? "100%"
                                                : "8%"
                                    }}
                                ></div>

                            </div>

                            <div className="quick-stat">

                                <span>
                                    Account Role
                                </span>

                                <strong>
                                    User
                                </strong>

                            </div>

                            {lastAttendance && (
                                <div className="latest-crowd">

                                    <div className="latest-crowd-icon">
                                        <CheckCircle2 size={17} />
                                    </div>

                                    <div>

                                        <span>
                                            Last Attendance
                                        </span>

                                        <strong>
                                            {lastAttendance.status ||
                                                "Present"}
                                        </strong>

                                    </div>

                                </div>
                            )}

                        </div>

                    </div>
                </>

            )}

            <div className="dashboard-bottom-grid">

                <div className="dashboard-recent-card">

                    <div className="card-title">

                        <div>

                            <h2>
                                {isAdmin
                                    ? "Recent Activity"
                                    : "My Recent Activity"}
                            </h2>

                            <p>
                                {isAdmin
                                    ? "Latest FaceGuard AI events"
                                    : "Your latest FaceGuard AI events"}
                            </p>

                        </div>

                        <Activity size={22} />

                    </div>

                    {recentActivities.length === 0 ? (

                        <div className="dashboard-no-activity">

                            <Activity size={34} />

                            <h3>
                                No recent activity
                            </h3>

                            <p>
                                {isAdmin
                                    ? "System activities will appear here automatically."
                                    : "Your activities will appear here automatically."}
                            </p>

                        </div>

                    ) : (

                        <div className="dashboard-activity-list">

                            {recentActivities.map(
                                (activity, index) => (
                                    <div
                                        className="dashboard-activity-item"
                                        key={
                                            activity._id ||
                                            index
                                        }
                                    >

                                        <div className="dashboard-activity-icon">

                                            {getActivityIcon(
                                                getActivityText(
                                                    activity
                                                )
                                            )}

                                        </div>

                                        <div className="dashboard-activity-info">

                                            <strong>
                                                {getActivityText(
                                                    activity
                                                )}
                                            </strong>

                                            <span>
                                                {getActivityDescription(
                                                    activity
                                                )}
                                            </span>

                                        </div>

                                        <div className="dashboard-activity-time">

                                            <Clock3 size={13} />

                                            {formatActivityTime(
                                                activity
                                            )}

                                        </div>

                                    </div>
                                )
                            )}

                        </div>

                    )}

                </div>

                <div className="dashboard-security-card">

                    <div className="dashboard-security-header">

                        <div className="dashboard-security-icon">
                            <ShieldCheck size={23} />
                        </div>

                        <div>

                            <h2>
                                {isAdmin
                                    ? "Security Center"
                                    : "Account Security"}
                            </h2>

                            <p>
                                {isAdmin
                                    ? "Current protection status"
                                    : "Your current protection status"}
                            </p>

                        </div>

                    </div>

                    <div className="security-check">

                        <div>
                            <span></span>
                        </div>

                        <div>
                            <strong>
                                AI Engine
                            </strong>

                            <small>
                                Python + Flask connected
                            </small>
                        </div>

                        <b>
                            Online
                        </b>

                    </div>

                    <div className="security-check">

                        <div>
                            <span></span>
                        </div>

                        <div>
                            <strong>
                                Database
                            </strong>

                            <small>
                                MongoDB connected
                            </small>
                        </div>

                        <b>
                            Online
                        </b>

                    </div>

                    <div className="security-check">

                        <div>
                            <span></span>
                        </div>

                        <div>
                            <strong>
                                Authentication
                            </strong>

                            <small>
                                JWT protection active
                            </small>
                        </div>

                        <b>
                            Secure
                        </b>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default Dashboard;