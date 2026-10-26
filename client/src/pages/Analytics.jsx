import { useEffect, useState } from "react";
import {
    Activity,
    Users,
    ScanFace,
    UserCheck,
    UserX,
    ShieldCheck,
    TrendingUp,
    BarChart3,
    Clock3,
    RefreshCw
} from "lucide-react";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

import { useAuth } from "../context/AuthContext";

function Analytics() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalUsers: 0,
        todayPresent: 0,
        totalAttendance: 0,
        faceAttempts: 0,
        failedAttempts: 0,
        avgConfidence: 0,
        crowdSessions: 0,
        peakCrowd: 0
    });

    const [attendanceData, setAttendanceData] = useState([]);

    const [recognitionData, setRecognitionData] = useState([
        {
            name: "Successful",
            value: 0
        },
        {
            name: "Failed",
            value: 0
        }
    ]);

    const [crowdData, setCrowdData] = useState([]);

    const [userAttendanceData, setUserAttendanceData] = useState([]);

    const [lastUpdated, setLastUpdated] = useState(null);

    const isAdmin =
        String(user?.role || "user").toLowerCase() === "admin";

    useEffect(() => {
        if (user && isAdmin) {
            loadAnalytics();
        }
    }, [user, isAdmin]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const [
                usersResponse,
                attendanceResponse,
                activityResponse,
                crowdResponse
            ] = await Promise.all([
                fetch(
                    "http://localhost:5000/api/users",
                    {
                        headers
                    }
                ),

                fetch(
                    "http://localhost:5000/api/attendance",
                    {
                        headers
                    }
                ),

                fetch(
                    "http://localhost:5000/api/activity-logs",
                    {
                        headers
                    }
                ),

                fetch(
                    "http://localhost:5000/api/crowd",
                    {
                        headers
                    }
                )
            ]);

            const users =
                usersResponse.ok
                    ? await usersResponse.json()
                    : [];

            const attendance =
                attendanceResponse.ok
                    ? await attendanceResponse.json()
                    : [];

            const activities =
                activityResponse.ok
                    ? await activityResponse.json()
                    : [];

            const crowd =
                crowdResponse.ok
                    ? await crowdResponse.json()
                    : [];

            const today = new Date();

            const isSameDay = (value) => {
                if (!value) {
                    return false;
                }

                const date = new Date(value);

                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {
                    return false;
                }

                return (
                    date.getFullYear() ===
                        today.getFullYear() &&
                    date.getMonth() ===
                        today.getMonth() &&
                    date.getDate() ===
                        today.getDate()
                );
            };

            const faceActivities =
                activities.filter(
                    (item) =>
                        item.action ===
                            "Face Authentication" ||
                        item.type ===
                            "Face Authentication"
                );

            const failedFaceAttempts =
                faceActivities.filter(
                    (item) => {
                        const text =
                            `${item.action || ""} ${
                                item.type || ""
                            } ${
                                item.description || ""
                            }`.toLowerCase();

                        return (
                            text.includes("unknown") ||
                            text.includes("failed") ||
                            text.includes("mismatch") ||
                            text.includes(
                                "could not be verified"
                            )
                        );
                    }
                );

            const successfulFaceAttempts =
                Math.max(
                    faceActivities.length -
                        failedFaceAttempts.length,
                    0
                );

            const todayAttendance =
                attendance.filter(
                    (item) =>
                        isSameDay(
                            item.createdAt
                        ) ||
                        isSameDay(
                            item.updatedAt
                        )
                );

            const confidenceValues =
                attendance
                    .map((item) =>
                        Number(
                            item.confidence
                        )
                    )
                    .filter(
                        (value) =>
                            Number.isFinite(
                                value
                            ) &&
                            value > 0
                    );

            const averageConfidence =
                confidenceValues.length > 0
                    ? confidenceValues.reduce(
                          (
                              total,
                              value
                          ) =>
                              total + value,
                          0
                      ) /
                      confidenceValues.length
                    : 0;

            const peakCrowd =
                crowd.length > 0
                    ? Math.max(
                          ...crowd.map(
                              (item) =>
                                  Number(
                                      item.totalFaces ||
                                          item.total_faces ||
                                          item.count ||
                                          0
                                  )
                          )
                      )
                    : 0;

            const weekly = [];

            for (
                let index = 6;
                index >= 0;
                index--
            ) {
                const date = new Date();

                date.setDate(
                    date.getDate() -
                        index
                );

                const dayAttendance =
                    attendance.filter(
                        (item) => {
                            const value =
                                item.createdAt ||
                                item.date;

                            if (!value) {
                                return false;
                            }

                            const recordDate =
                                new Date(
                                    value
                                );

                            return (
                                !Number.isNaN(
                                    recordDate.getTime()
                                ) &&
                                recordDate.getFullYear() ===
                                    date.getFullYear() &&
                                recordDate.getMonth() ===
                                    date.getMonth() &&
                                recordDate.getDate() ===
                                    date.getDate()
                            );
                        }
                    ).length;

                weekly.push({
                    day: date.toLocaleDateString(
                        "en-IN",
                        {
                            day: "2-digit",
                            month: "short"
                        }
                    ),
                    attendance:
                        dayAttendance
                });
            }

            const crowdLevels = {
                Empty: 0,
                Safe: 0,
                Moderate: 0,
                High: 0,
                Critical: 0
            };

            crowd.forEach((item) => {
                const level = String(
                    item.level || ""
                );

                if (
                    crowdLevels[level] !==
                    undefined
                ) {
                    crowdLevels[level]++;
                }
            });

            const crowdChart = [
                {
                    name: "Empty",
                    value:
                        crowdLevels.Empty
                },
                {
                    name: "Safe",
                    value:
                        crowdLevels.Safe
                },
                {
                    name: "Moderate",
                    value:
                        crowdLevels.Moderate
                },
                {
                    name: "High",
                    value:
                        crowdLevels.High
                },
                {
                    name: "Critical",
                    value:
                        crowdLevels.Critical
                }
            ];

            const attendanceByUser = {};

            attendance.forEach((item) => {
                const name =
                    item.user?.name ||
                    item.name ||
                    "Unknown User";

                if (
                    !attendanceByUser[name]
                ) {
                    attendanceByUser[name] = 0;
                }

                attendanceByUser[name]++;
            });

            const userChart =
                Object.entries(
                    attendanceByUser
                )
                    .map(
                        ([
                            name,
                            attendanceCount
                        ]) => ({
                            name,
                            attendance:
                                attendanceCount
                        })
                    )
                    .sort(
                        (a, b) =>
                            b.attendance -
                            a.attendance
                    )
                    .slice(0, 8);

            setStats({
                totalUsers:
                    Array.isArray(users)
                        ? users.length
                        : 0,

                todayPresent:
                    todayAttendance.length,

                totalAttendance:
                    attendance.length,

                faceAttempts:
                    faceActivities.length,

                failedAttempts:
                    failedFaceAttempts.length,

                avgConfidence:
                    averageConfidence,

                crowdSessions:
                    crowd.length,

                peakCrowd
            });

            setAttendanceData(
                weekly
            );

            setRecognitionData([
                {
                    name: "Successful",
                    value:
                        successfulFaceAttempts
                },
                {
                    name: "Failed",
                    value:
                        failedFaceAttempts.length
                }
            ]);

            setCrowdData(
                crowdChart
            );

            setUserAttendanceData(
                userChart
            );

            setLastUpdated(
                new Date()
            );

        } catch (error) {
            console.error(
                "Analytics loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="analytics-page">

            <div className="page-header">

                <div>
                    <span className="page-eyebrow">
                        SYSTEM ANALYTICS
                    </span>

                    <h2>
                        Analytics
                    </h2>

                    <p>
                        Real-time insights from
                        FaceGuard AI activity,
                        attendance and crowd
                        analysis.
                    </p>
                </div>

                <div className="analytics-header-actions">

                    <div className="analytics-live">
                        <span></span>
                        Live Analytics
                    </div>

                    <button
                        type="button"
                        className="analytics-refresh-button"
                        onClick={
                            loadAnalytics
                        }
                        disabled={loading}
                    >
                        <RefreshCw
                            size={16}
                            className={
                                loading
                                    ? "analytics-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                </div>

            </div>

            <div className="analytics-last-updated">

                <Clock3 size={15} />

                Last updated:

                <strong>
                    {lastUpdated
                        ? lastUpdated.toLocaleTimeString(
                              "en-IN",
                              {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit"
                              }
                          )
                        : "--"}
                </strong>

            </div>

            <div className="analytics-stat-grid">

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <Users size={23} />
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

                        <small>
                            Registered accounts
                        </small>
                    </div>

                </div>

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <UserCheck size={23} />
                    </div>

                    <div>
                        <span>
                            Present Today
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : stats.todayPresent}
                        </strong>

                        <small>
                            Today's attendance
                        </small>
                    </div>

                </div>

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <Activity size={23} />
                    </div>

                    <div>
                        <span>
                            Total Attendance
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : stats.totalAttendance}
                        </strong>

                        <small>
                            All attendance records
                        </small>
                    </div>

                </div>

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <ScanFace size={23} />
                    </div>

                    <div>
                        <span>
                            Face Auth Attempts
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : stats.faceAttempts}
                        </strong>

                        <small>
                            Authentication events
                        </small>
                    </div>

                </div>

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <UserX size={23} />
                    </div>

                    <div>
                        <span>
                            Failed Attempts
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : stats.failedAttempts}
                        </strong>

                        <small>
                            Unknown or rejected
                        </small>
                    </div>

                </div>

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <ShieldCheck size={23} />
                    </div>

                    <div>
                        <span>
                            Avg Confidence
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : `${stats.avgConfidence.toFixed(
                                      1
                                  )}%`}
                        </strong>

                        <small>
                            Face match confidence
                        </small>
                    </div>

                </div>

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <BarChart3 size={23} />
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

                        <small>
                            Saved AI analyses
                        </small>
                    </div>

                </div>

                <div className="analytics-stat-card">

                    <div className="analytics-icon">
                        <Users size={23} />
                    </div>

                    <div>
                        <span>
                            Peak Crowd
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : stats.peakCrowd}
                        </strong>

                        <small>
                            Maximum faces detected
                        </small>
                    </div>

                </div>

            </div>

            <div className="analytics-grid">

                <div className="analytics-card analytics-wide">

                    <div className="analytics-card-header">

                        <div>
                            <h3>
                                7-Day Attendance Trend
                            </h3>

                            <p>
                                Attendance records
                                created during the
                                last seven days
                            </p>
                        </div>

                        <TrendingUp size={22} />

                    </div>

                    <div className="chart-container">

                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >
                            <AreaChart
                                data={
                                    attendanceData
                                }
                            >

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                />

                                <XAxis
                                    dataKey="day"
                                />

                                <YAxis
                                    allowDecimals={
                                        false
                                    }
                                />

                                <Tooltip />

                                <Area
                                    type="monotone"
                                    dataKey="attendance"
                                    strokeWidth={3}
                                    fillOpacity={0.2}
                                />

                            </AreaChart>
                        </ResponsiveContainer>

                    </div>

                </div>

                <div className="analytics-card">

                    <div className="analytics-card-header">

                        <div>
                            <h3>
                                Recognition Status
                            </h3>

                            <p>
                                Successful vs failed
                                authentication
                            </p>
                        </div>

                        <ShieldCheck size={22} />

                    </div>

                    <div className="chart-container">

                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >
                            <PieChart>

                                <Pie
                                    data={
                                        recognitionData
                                    }
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={95}
                                    label
                                >

                                    {recognitionData.map(
                                        (
                                            entry,
                                            index
                                        ) => (
                                            <Cell
                                                key={
                                                    index
                                                }
                                            />
                                        )
                                    )}

                                </Pie>

                                <Tooltip />

                                <Legend />

                            </PieChart>
                        </ResponsiveContainer>

                    </div>

                </div>

                <div className="analytics-card">

                    <div className="analytics-card-header">

                        <div>
                            <h3>
                                Crowd Intelligence
                            </h3>

                            <p>
                                Crowd levels detected
                                by AI analysis
                            </p>
                        </div>

                        <Users size={22} />

                    </div>

                    <div className="chart-container">

                        <ResponsiveContainer
                            width="100%"
                            height={300}
                        >
                            <BarChart
                                data={
                                    crowdData
                                }
                            >

                                <CartesianGrid
                                    strokeDasharray="3 3"
                                />

                                <XAxis
                                    dataKey="name"
                                />

                                <YAxis
                                    allowDecimals={
                                        false
                                    }
                                />

                                <Tooltip />

                                <Bar
                                    dataKey="value"
                                    radius={[
                                        8,
                                        8,
                                        0,
                                        0
                                    ]}
                                />

                            </BarChart>
                        </ResponsiveContainer>

                    </div>

                </div>

                <div className="analytics-card analytics-wide">

                    <div className="analytics-card-header">

                        <div>
                            <h3>
                                User-wise Attendance
                            </h3>

                            <p>
                                Attendance records
                                grouped by registered
                                user
                            </p>
                        </div>

                        <Users size={22} />

                    </div>

                    <div className="analytics-user-list">

                        {userAttendanceData.length ===
                        0 ? (
                            <div className="analytics-empty">

                                <Users size={34} />

                                <h3>
                                    No attendance data
                                </h3>

                                <p>
                                    User attendance
                                    statistics will
                                    appear here.
                                </p>

                            </div>
                        ) : (
                            userAttendanceData.map(
                                (
                                    item,
                                    index
                                ) => (
                                    <div
                                        className="analytics-user-row"
                                        key={
                                            item.name
                                        }
                                    >

                                        <div className="analytics-user-rank">
                                            {index + 1}
                                        </div>

                                        <div className="analytics-user-info">

                                            <strong>
                                                {
                                                    item.name
                                                }
                                            </strong>

                                            <div className="analytics-user-track">

                                                <div
                                                    className="analytics-user-fill"
                                                    style={{
                                                        width: `${
                                                            Math.min(
                                                                (
                                                                    item.attendance /
                                                                    Math.max(
                                                                        userAttendanceData[0]
                                                                            ?.attendance ||
                                                                            1,
                                                                        1
                                                                    )
                                                                ) *
                                                                    100,
                                                                100
                                                            )
                                                        }%`
                                                    }}
                                                ></div>

                                            </div>

                                        </div>

                                        <strong className="analytics-user-count">
                                            {
                                                item.attendance
                                            }
                                        </strong>

                                    </div>
                                )
                            )
                        )}

                    </div>

                </div>

            </div>

            <div className="analytics-insight">

                <div className="insight-icon">

                    <ShieldCheck size={24} />

                </div>

                <div>

                    <h3>
                        AI Security Overview
                    </h3>

                    <p>
                        FaceGuard AI combines biometric
                        authentication, attendance
                        monitoring and crowd analysis
                        into a unified administrative
                        monitoring system.
                    </p>

                </div>

                <div className="insight-status">

                    <span></span>

                    AI Engine Online

                </div>

            </div>

        </div>
    );
}

export default Analytics;