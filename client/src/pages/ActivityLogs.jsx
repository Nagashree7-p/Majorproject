import { useEffect, useState } from "react";
import {
    Activity,
    ScanFace,
    Users,
    ClipboardCheck,
    UserPlus,
    LogIn,
    ShieldCheck,
    Clock3,
    Search,
    RefreshCw,
    ArrowUpRight
} from "lucide-react";

function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const token = localStorage.getItem("token");

            const response = await fetch(
                "http://localhost:5000/api/activity-logs",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                setLogs([]);
                return;
            }

            const data = await response.json();

            setLogs(
                Array.isArray(data)
                    ? data
                    : []
            );
        } catch (error) {
            console.error(
                "Activity logs loading error:",
                error
            );

            setLogs([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getActivityType = (action) => {
        const value = String(
            action || ""
        ).toLowerCase();

        if (value.includes("crowd")) {
            return "crowd";
        }

        if (value.includes("group")) {
            return "group";
        }

        if (value.includes("face")) {
            return "face";
        }

        if (value.includes("attendance")) {
            return "attendance";
        }

        if (value.includes("login")) {
            return "login";
        }

        if (value.includes("register")) {
            return "register";
        }

        return "system";
    };

    const getIcon = (type) => {
        if (type === "crowd") {
            return <Users size={19} />;
        }

        if (type === "group") {
            return <Users size={19} />;
        }

        if (type === "face") {
            return <ScanFace size={19} />;
        }

        if (type === "attendance") {
            return <ClipboardCheck size={19} />;
        }

        if (type === "login") {
            return <LogIn size={19} />;
        }

        if (type === "register") {
            return <UserPlus size={19} />;
        }

        return <Activity size={19} />;
    };

    const getActionText = (log) => {
        return (
            log.action ||
            log.activity ||
            log.type ||
            "System Activity"
        );
    };

    const getDescription = (log) => {
        return (
            log.description ||
            log.message ||
            log.details ||
            "System activity recorded"
        );
    };

    const filteredLogs = logs.filter((log) => {
        const searchText = `
            ${getActionText(log)}
            ${getDescription(log)}
            ${log.user?.name || ""}
            ${log.user?.email || ""}
        `.toLowerCase();

        return searchText.includes(
            search.toLowerCase()
        );
    });

    const faceActivities = logs.filter(
        (log) =>
            getActivityType(
                getActionText(log)
            ) === "face"
    ).length;

    const crowdActivities = logs.filter(
        (log) =>
            getActivityType(
                getActionText(log)
            ) === "crowd"
    ).length;

    const groupActivities = logs.filter(
        (log) =>
            getActivityType(
                getActionText(log)
            ) === "group"
    ).length;

    return (
        <div className="activity-modern-page">

            <div className="activity-modern-header">

                <div>

                    <div className="activity-title-row">

                        <div className="activity-title-icon">
                            <Activity size={22} />
                        </div>

                        <div>

                            <span className="activity-eyebrow">
                                SYSTEM MONITORING
                            </span>

                            <h1>
                                Activity Logs
                            </h1>

                        </div>

                    </div>

                    <p>
                        Monitor important activities performed
                        across FaceGuard AI.
                    </p>

                </div>

                <button
                    className="activity-refresh-btn"
                    onClick={() =>
                        loadLogs(true)
                    }
                    disabled={refreshing}
                >

                    <RefreshCw
                        size={17}
                        className={
                            refreshing
                                ? "activity-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh Logs"}

                </button>

            </div>

            <div className="activity-stat-grid">

                <div className="activity-stat-card">

                    <div className="activity-stat-icon purple">
                        <Activity size={21} />
                    </div>

                    <div>

                        <span>
                            Total Activities
                        </span>

                        <strong>
                            {logs.length}
                        </strong>

                    </div>

                    <ArrowUpRight size={16} />

                </div>

                <div className="activity-stat-card">

                    <div className="activity-stat-icon blue">
                        <ScanFace size={21} />
                    </div>

                    <div>

                        <span>
                            Face Activities
                        </span>

                        <strong>
                            {faceActivities}
                        </strong>

                    </div>

                    <ArrowUpRight size={16} />

                </div>

                <div className="activity-stat-card">

                    <div className="activity-stat-icon cyan">
                        <Users size={21} />
                    </div>

                    <div>

                        <span>
                            Crowd Activities
                        </span>

                        <strong>
                            {crowdActivities}
                        </strong>

                    </div>

                    <ArrowUpRight size={16} />

                </div>

                <div className="activity-stat-card">

                    <div className="activity-stat-icon green">
                        <ShieldCheck size={21} />
                    </div>

                    <div>

                        <span>
                            System Status
                        </span>

                        <strong>
                            Online
                        </strong>

                    </div>

                    <div className="activity-online-dot">
                        <span></span>
                    </div>

                </div>

            </div>

            <div className="activity-overview-card">

                <div className="activity-overview-left">

                    <div className="activity-overview-icon">
                        <ShieldCheck size={28} />
                    </div>

                    <div>

                        <span>
                            SECURITY OVERVIEW
                        </span>

                        <h2>
                            FaceGuard AI Monitoring
                        </h2>

                        <p>
                            All major authentication and
                            monitoring activities are being
                            recorded in the system.
                        </p>

                    </div>

                </div>

                <div className="activity-overview-metrics">

                    <div>
                        <strong>
                            {groupActivities}
                        </strong>

                        <span>
                            Group Scans
                        </span>
                    </div>

                    <div>
                        <strong>
                            {faceActivities}
                        </strong>

                        <span>
                            Face Scans
                        </span>
                    </div>

                    <div>
                        <strong>
                            {crowdActivities}
                        </strong>

                        <span>
                            Crowd Scans
                        </span>
                    </div>

                </div>

            </div>

            <div className="activity-log-card">

                <div className="activity-log-header">

                    <div>

                        <span className="activity-section-label">
                            EVENT HISTORY
                        </span>

                        <h2>
                            Recent Activities
                        </h2>

                        <p>
                            Latest FaceGuard AI system events
                        </p>

                    </div>

                    <div className="activity-search-box">

                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search activity..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>

                </div>

                {loading ? (

                    <div className="activity-modern-empty">

                        <div className="activity-loading-circle">
                            <RefreshCw
                                size={25}
                                className="activity-spin"
                            />
                        </div>

                        <h3>
                            Loading activity logs
                        </h3>

                        <p>
                            Fetching the latest system events.
                        </p>

                    </div>

                ) : filteredLogs.length === 0 ? (

                    <div className="activity-modern-empty">

                        <div className="activity-empty-icon">
                            <Activity size={35} />
                        </div>

                        <h3>
                            No activity logs found
                        </h3>

                        <p>
                            {search
                                ? "Try a different search."
                                : "Activity logs will appear here when system activities are recorded."}
                        </p>

                    </div>

                ) : (

                    <div className="activity-timeline">

                        {filteredLogs.map(
                            (log, index) => {

                                const action =
                                    getActionText(log);

                                const description =
                                    getDescription(log);

                                const type =
                                    getActivityType(
                                        action
                                    );

                                const dateValue =
                                    log.createdAt ||
                                    log.timestamp ||
                                    log.date;

                                const date =
                                    dateValue
                                        ? new Date(
                                              dateValue
                                          )
                                        : null;

                                return (
                                    <div
                                        className="activity-timeline-item"
                                        key={
                                            log._id ||
                                            index
                                        }
                                    >

                                        <div
                                            className={`activity-timeline-line ${
                                                index ===
                                                filteredLogs.length -
                                                    1
                                                    ? "last"
                                                    : ""
                                            }`}
                                        ></div>

                                        <div
                                            className={`activity-event-icon ${type}`}
                                        >
                                            {getIcon(
                                                type
                                            )}
                                        </div>

                                        <div className="activity-event-card">

                                            <div className="activity-event-top">

                                                <div>

                                                    <span
                                                        className={`activity-type-badge ${type}`}
                                                    >
                                                        {action}
                                                    </span>

                                                    <h3>
                                                        {
                                                            action
                                                        }
                                                    </h3>

                                                </div>

                                                <div className="activity-event-time">

                                                    <Clock3
                                                        size={14}
                                                    />

                                                    {date &&
                                                    !isNaN(
                                                        date.getTime()
                                                    )
                                                        ? date.toLocaleString()
                                                        : "Recently"}

                                                </div>

                                            </div>

                                            <p>
                                                {
                                                    description
                                                }
                                            </p>

                                            {log.user && (
                                                <div className="activity-user-chip">

                                                    <div className="activity-user-avatar">
                                                        {
                                                            (
                                                                log.user
                                                                    .name ||
                                                                log.user
                                                                    .email ||
                                                                "U"
                                                            )
                                                                .charAt(
                                                                    0
                                                                )
                                                                .toUpperCase()
                                                        }
                                                    </div>

                                                    <div>

                                                        <span>
                                                            Activity performed by
                                                        </span>

                                                        <strong>
                                                            {
                                                                log.user
                                                                    .name ||
                                                                log.user
                                                                    .email ||
                                                                "System User"
                                                            }
                                                        </strong>

                                                    </div>

                                                </div>
                                            )}

                                        </div>

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

export default ActivityLogs;