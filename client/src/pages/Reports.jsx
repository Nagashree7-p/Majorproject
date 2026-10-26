import { useEffect, useMemo, useState } from "react";
import {
    FileText,
    Download,
    Printer,
    RefreshCw,
    Users,
    UserCheck,
    ScanFace,
    Radar,
    Search,
    CalendarDays,
    ShieldCheck
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Reports() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);

    const [attendance, setAttendance] = useState([]);
    const [activities, setActivities] = useState([]);
    const [crowd, setCrowd] = useState([]);
    const [users, setUsers] = useState([]);

    const [reportType, setReportType] =
        useState("attendance");

    const [dateFilter, setDateFilter] =
        useState("all");

    const [search, setSearch] =
        useState("");

    const [generatedAt, setGeneratedAt] =
        useState(null);

    const isAdmin =
        String(
            user?.role || "user"
        ).toLowerCase() === "admin";

    useEffect(() => {
        if (user && isAdmin) {
            loadReports();
        }
    }, [user, isAdmin]);

    const loadReports = async () => {
        try {
            setLoading(true);

            const token =
                localStorage.getItem("token");

            const headers = {
                Authorization:
                    `Bearer ${token}`
            };

            const [
                usersResponse,
                attendanceResponse,
                activitiesResponse,
                crowdResponse
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
                    "http://localhost:5000/api/activity-logs",
                    { headers }
                ),

                fetch(
                    "http://localhost:5000/api/crowd",
                    { headers }
                )
            ]);

            const usersData =
                usersResponse.ok
                    ? await usersResponse.json()
                    : [];

            const attendanceData =
                attendanceResponse.ok
                    ? await attendanceResponse.json()
                    : [];

            const activitiesData =
                activitiesResponse.ok
                    ? await activitiesResponse.json()
                    : [];

            const crowdData =
                crowdResponse.ok
                    ? await crowdResponse.json()
                    : [];

            setUsers(
                Array.isArray(usersData)
                    ? usersData
                    : []
            );

            setAttendance(
                Array.isArray(
                    attendanceData
                )
                    ? attendanceData
                    : []
            );

            setActivities(
                Array.isArray(
                    activitiesData
                )
                    ? activitiesData
                    : []
            );

            setCrowd(
                Array.isArray(crowdData)
                    ? crowdData
                    : []
            );

            setGeneratedAt(
                new Date()
            );
        } catch (error) {
            console.error(
                "Reports loading error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const getRecordDate = (record) => {
        return (
            record?.createdAt ||
            record?.updatedAt ||
            record?.date ||
            record?.timestamp ||
            null
        );
    };

    const isWithinDateFilter = (record) => {
        if (dateFilter === "all") {
            return true;
        }

        const value =
            getRecordDate(record);

        if (!value) {
            return false;
        }

        const recordDate =
            new Date(value);

        if (
            Number.isNaN(
                recordDate.getTime()
            )
        ) {
            return false;
        }

        const now = new Date();

        const startDate =
            new Date();

        if (dateFilter === "today") {
            startDate.setHours(
                0,
                0,
                0,
                0
            );
        }

        if (dateFilter === "7days") {
            startDate.setDate(
                now.getDate() - 6
            );

            startDate.setHours(
                0,
                0,
                0,
                0
            );
        }

        if (dateFilter === "30days") {
            startDate.setDate(
                now.getDate() - 29
            );

            startDate.setHours(
                0,
                0,
                0,
                0
            );
        }

        return recordDate >= startDate;
    };

    const formatDate = (value) => {
        if (!value) {
            return "--";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "--";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    };

    const formatTime = (value) => {
        if (!value) {
            return "--";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
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

    const attendanceRows =
        useMemo(() => {
            return attendance
                .filter(
                    isWithinDateFilter
                )
                .map(
                    (item) => ({
                        date:
                            item.createdAt ||
                            item.updatedAt,

                        name:
                            item.user?.name ||
                            item.name ||
                            "Unknown User",

                        email:
                            item.user?.email ||
                            "--",

                        status:
                            item.status ||
                            "Present",

                        method:
                            item.method ||
                            "Face Authentication",

                        confidence:
                            Number(
                                item.confidence || 0
                            )
                    })
                );
        }, [
            attendance,
            dateFilter
        ]);

    const faceRows =
        useMemo(() => {
            return activities
                .filter(
                    (item) =>
                        item.action ===
                            "Face Authentication" ||
                        item.type ===
                            "Face Authentication"
                )
                .filter(
                    isWithinDateFilter
                )
                .map(
                    (item) => {
                        const description =
                            String(
                                item.description ||
                                    ""
                            );

                        const text =
                            description.toLowerCase();

                        let status =
                            "Successful";

                        if (
                            text.includes(
                                "unknown"
                            ) ||
                            text.includes(
                                "failed"
                            ) ||
                            text.includes(
                                "mismatch"
                            ) ||
                            text.includes(
                                "could not be verified"
                            )
                        ) {
                            status =
                                "Failed";
                        }

                        return {
                            date:
                                item.createdAt ||
                                item.updatedAt,

                            name:
                                item.user?.name ||
                                "Unknown User",

                            email:
                                item.user?.email ||
                                "--",

                            status,

                            description
                        };
                    }
                );
        }, [
            activities,
            dateFilter
        ]);

    const crowdRows =
        useMemo(() => {
            return crowd
                .filter(
                    isWithinDateFilter
                )
                .map(
                    (item) => ({
                        date:
                            item.createdAt ||
                            item.updatedAt,

                        faces:
                            Number(
                                item.totalFaces ||
                                    item.total_faces ||
                                    item.count ||
                                    0
                            ),

                        level:
                            item.level ||
                            "Unknown",

                        message:
                            item.message ||
                            "Crowd analysis completed"
                    })
                );
        }, [
            crowd,
            dateFilter
        ]);

    const currentRows =
        useMemo(() => {
            let rows = [];

            if (
                reportType ===
                "attendance"
            ) {
                rows =
                    attendanceRows;
            }

            if (
                reportType ===
                "face"
            ) {
                rows =
                    faceRows;
            }

            if (
                reportType ===
                "crowd"
            ) {
                rows =
                    crowdRows;
            }

            if (
                reportType ===
                "all"
            ) {
                rows = [
                    ...attendanceRows.map(
                        (item) => ({
                            category:
                                "Attendance",
                            date:
                                item.date,
                            name:
                                item.name,
                            email:
                                item.email,
                            status:
                                item.status,
                            details:
                                item.method
                        })
                    ),

                    ...faceRows.map(
                        (item) => ({
                            category:
                                "Face Authentication",
                            date:
                                item.date,
                            name:
                                item.name,
                            email:
                                item.email,
                            status:
                                item.status,
                            details:
                                item.description
                        })
                    ),

                    ...crowdRows.map(
                        (item) => ({
                            category:
                                "Crowd Analysis",
                            date:
                                item.date,
                            name:
                                "System",
                            email:
                                "--",
                            status:
                                item.level,
                            details:
                                `${item.faces} faces detected`
                        })
                    )
                ];
            }

            const query =
                search.trim().toLowerCase();

            if (!query) {
                return rows;
            }

            return rows.filter(
                (item) => {
                    return (
                        String(
                            item.name ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            item.email ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            item.status ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            item.method ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            item.level ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query) ||
                        String(
                            item.details ||
                                ""
                        )
                            .toLowerCase()
                            .includes(query)
                    );
                }
            );
        }, [
            reportType,
            attendanceRows,
            faceRows,
            crowdRows,
            search
        ]);

    const reportStats =
        useMemo(() => {
            const present =
                attendanceRows.filter(
                    (item) =>
                        String(
                            item.status
                        ).toLowerCase() ===
                        "present"
                ).length;

            const successfulFace =
                faceRows.filter(
                    (item) =>
                        item.status ===
                        "Successful"
                ).length;

            const failedFace =
                faceRows.filter(
                    (item) =>
                        item.status ===
                        "Failed"
                ).length;

            const peakCrowd =
                crowdRows.length > 0
                    ? Math.max(
                          ...crowdRows.map(
                              (item) =>
                                  item.faces
                          )
                      )
                    : 0;

            const confidenceValues =
                attendanceRows
                    .map(
                        (item) =>
                            item.confidence
                    )
                    .filter(
                        (value) =>
                            Number.isFinite(
                                value
                            ) &&
                            value > 0
                    );

            const averageConfidence =
                confidenceValues.length >
                0
                    ? confidenceValues.reduce(
                          (
                              total,
                              value
                          ) =>
                              total +
                              value,
                          0
                      ) /
                      confidenceValues.length
                    : 0;

            return {
                totalUsers:
                    users.length,

                attendanceRecords:
                    attendanceRows.length,

                present,

                faceAttempts:
                    faceRows.length,

                successfulFace,

                failedFace,

                crowdSessions:
                    crowdRows.length,

                peakCrowd,

                averageConfidence
            };
        }, [
            users,
            attendanceRows,
            faceRows,
            crowdRows
        ]);

    const reportTitle = () => {
        if (
            reportType ===
            "attendance"
        ) {
            return "Attendance Report";
        }

        if (
            reportType ===
            "face"
        ) {
            return "Face Authentication Report";
        }

        if (
            reportType ===
            "crowd"
        ) {
            return "Crowd Analysis Report";
        }

        return "Complete System Report";
    };

    const downloadCSV = () => {
        if (
            currentRows.length === 0
        ) {
            return;
        }

        let headers = [];

        if (
            reportType ===
            "attendance"
        ) {
            headers = [
                "Date",
                "Time",
                "Name",
                "Email",
                "Status",
                "Method",
                "Confidence"
            ];
        }

        if (
            reportType ===
            "face"
        ) {
            headers = [
                "Date",
                "Time",
                "Name",
                "Email",
                "Status",
                "Description"
            ];
        }

        if (
            reportType ===
            "crowd"
        ) {
            headers = [
                "Date",
                "Time",
                "Faces Detected",
                "Crowd Level",
                "Message"
            ];
        }

        if (
            reportType ===
            "all"
        ) {
            headers = [
                "Category",
                "Date",
                "Time",
                "Name",
                "Email",
                "Status",
                "Details"
            ];
        }

        const escapeCSV = (
            value
        ) => {
            return `"${String(
                value ?? ""
            ).replace(
                /"/g,
                '""'
            )}"`;
        };

        const lines = [
            headers.join(",")
        ];

        currentRows.forEach(
            (row) => {
                if (
                    reportType ===
                    "attendance"
                ) {
                    lines.push(
                        [
                            escapeCSV(
                                formatDate(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                formatTime(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                row.name
                            ),
                            escapeCSV(
                                row.email
                            ),
                            escapeCSV(
                                row.status
                            ),
                            escapeCSV(
                                row.method
                            ),
                            escapeCSV(
                                row.confidence
                                    ? `${row.confidence.toFixed(
                                          2
                                      )}%`
                                    : "--"
                            )
                        ].join(",")
                    );
                }

                if (
                    reportType ===
                    "face"
                ) {
                    lines.push(
                        [
                            escapeCSV(
                                formatDate(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                formatTime(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                row.name
                            ),
                            escapeCSV(
                                row.email
                            ),
                            escapeCSV(
                                row.status
                            ),
                            escapeCSV(
                                row.description
                            )
                        ].join(",")
                    );
                }

                if (
                    reportType ===
                    "crowd"
                ) {
                    lines.push(
                        [
                            escapeCSV(
                                formatDate(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                formatTime(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                row.faces
                            ),
                            escapeCSV(
                                row.level
                            ),
                            escapeCSV(
                                row.message
                            )
                        ].join(",")
                    );
                }

                if (
                    reportType ===
                    "all"
                ) {
                    lines.push(
                        [
                            escapeCSV(
                                row.category
                            ),
                            escapeCSV(
                                formatDate(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                formatTime(
                                    row.date
                                )
                            ),
                            escapeCSV(
                                row.name
                            ),
                            escapeCSV(
                                row.email
                            ),
                            escapeCSV(
                                row.status
                            ),
                            escapeCSV(
                                row.details
                            )
                        ].join(",")
                    );
                }
            }
        );

        const blob =
            new Blob(
                [
                    lines.join("\n")
                ],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const link =
            document.createElement(
                "a"
            );

        link.href = url;

        link.download =
            `${reportTitle()
                .replace(
                    /\s+/g,
                    "_"
                )
                .toLowerCase()}_${Date.now()}.csv`;

        document.body.appendChild(
            link
        );

        link.click();

        document.body.removeChild(
            link
        );

        URL.revokeObjectURL(
            url
        );
    };

    const printReport = () => {
        window.print();
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="reports-page">

            <div className="reports-header">

                <div>
                    <span className="reports-eyebrow">
                        ADMIN REPORT CENTER
                    </span>

                    <h1>
                        Reports
                    </h1>

                    <p>
                        Generate detailed reports
                        from attendance,
                        authentication and
                        crowd-analysis data.
                    </p>
                </div>

                <div className="reports-header-actions">

                    <button
                        type="button"
                        className="reports-action secondary"
                        onClick={
                            loadReports
                        }
                        disabled={loading}
                    >
                        <RefreshCw
                            size={17}
                            className={
                                loading
                                    ? "reports-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        type="button"
                        className="reports-action"
                        onClick={
                            downloadCSV
                        }
                        disabled={
                            currentRows.length ===
                            0
                        }
                    >
                        <Download size={17} />

                        Download CSV
                    </button>

                    <button
                        type="button"
                        className="reports-action"
                        onClick={
                            printReport
                        }
                    >
                        <Printer size={17} />

                        Print Report
                    </button>

                </div>

            </div>

            <div className="reports-summary-grid">

                <div className="reports-summary-card">

                    <div className="reports-summary-icon">
                        <Users size={22} />
                    </div>

                    <div>
                        <span>
                            Total Users
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : reportStats.totalUsers}
                        </strong>
                    </div>

                </div>

                <div className="reports-summary-card">

                    <div className="reports-summary-icon">
                        <UserCheck size={22} />
                    </div>

                    <div>
                        <span>
                            Present Records
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : reportStats.present}
                        </strong>
                    </div>

                </div>

                <div className="reports-summary-card">

                    <div className="reports-summary-icon">
                        <ScanFace size={22} />
                    </div>

                    <div>
                        <span>
                            Face Attempts
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : reportStats.faceAttempts}
                        </strong>
                    </div>

                </div>

                <div className="reports-summary-card">

                    <div className="reports-summary-icon">
                        <Radar size={22} />
                    </div>

                    <div>
                        <span>
                            Crowd Sessions
                        </span>

                        <strong>
                            {loading
                                ? "..."
                                : reportStats.crowdSessions}
                        </strong>
                    </div>

                </div>

            </div>

            <div className="reports-control-card">

                <div className="reports-control-group">

                    <label>
                        <FileText size={15} />
                        Report Type
                    </label>

                    <select
                        value={
                            reportType
                        }
                        onChange={(event) =>
                            setReportType(
                                event.target
                                    .value
                            )
                        }
                    >
                        <option value="attendance">
                            Attendance Report
                        </option>

                        <option value="face">
                            Face Authentication Report
                        </option>

                        <option value="crowd">
                            Crowd Analysis Report
                        </option>

                        <option value="all">
                            Complete System Report
                        </option>
                    </select>

                </div>

                <div className="reports-control-group">

                    <label>
                        <CalendarDays
                            size={15}
                        />
                        Time Period
                    </label>

                    <select
                        value={
                            dateFilter
                        }
                        onChange={(event) =>
                            setDateFilter(
                                event.target
                                    .value
                            )
                        }
                    >
                        <option value="all">
                            All Records
                        </option>

                        <option value="today">
                            Today
                        </option>

                        <option value="7days">
                            Last 7 Days
                        </option>

                        <option value="30days">
                            Last 30 Days
                        </option>
                    </select>

                </div>

                <div className="reports-control-group reports-search-group">

                    <label>
                        <Search size={15} />
                        Search
                    </label>

                    <div className="reports-search-box">

                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search name, email, status..."
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event
                                        .target
                                        .value
                                )
                            }
                        />

                    </div>

                </div>

            </div>

            <div className="reports-paper">

                <div className="reports-paper-header">

                    <div>

                        <div className="reports-paper-brand">
                            <ShieldCheck
                                size={21}
                            />

                            FACEGUARD AI
                        </div>

                        <h2>
                            {reportTitle()}
                        </h2>

                        <p>
                            Generated from
                            the FaceGuard AI
                            administrative
                            monitoring system.
                        </p>

                    </div>

                    <div className="reports-generated">

                        <span>
                            Generated
                        </span>

                        <strong>
                            {generatedAt
                                ? generatedAt.toLocaleString(
                                      "en-IN"
                                  )
                                : "--"}
                        </strong>

                    </div>

                </div>

                <div className="reports-mini-stats">

                    <div>
                        <span>
                            Records
                        </span>

                        <strong>
                            {
                                currentRows.length
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Successful
                        </span>

                        <strong>
                            {
                                reportStats.successfulFace
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Failed
                        </span>

                        <strong>
                            {
                                reportStats.failedFace
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Peak Crowd
                        </span>

                        <strong>
                            {
                                reportStats.peakCrowd
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Avg Confidence
                        </span>

                        <strong>
                            {reportStats.averageConfidence
                                ? `${reportStats.averageConfidence.toFixed(
                                      1
                                  )}%`
                                : "--"}
                        </strong>
                    </div>

                </div>

                <div className="reports-table-wrapper">

                    {currentRows.length ===
                    0 ? (
                        <div className="reports-empty">

                            <FileText
                                size={42}
                            />

                            <h3>
                                No records found
                            </h3>

                            <p>
                                Try changing the
                                report type,
                                time period or
                                search text.
                            </p>

                        </div>
                    ) : (
                        <table className="reports-table">

                            <thead>

                                <tr>

                                    <th>
                                        Date
                                    </th>

                                    <th>
                                        Time
                                    </th>

                                    {reportType ===
                                        "attendance" && (
                                        <>
                                            <th>
                                                User
                                            </th>

                                            <th>
                                                Email
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Method
                                            </th>

                                            <th>
                                                Confidence
                                            </th>
                                        </>
                                    )}

                                    {reportType ===
                                        "face" && (
                                        <>
                                            <th>
                                                User
                                            </th>

                                            <th>
                                                Email
                                            </th>

                                            <th>
                                                Result
                                            </th>

                                            <th>
                                                Description
                                            </th>
                                        </>
                                    )}

                                    {reportType ===
                                        "crowd" && (
                                        <>
                                            <th>
                                                Faces
                                            </th>

                                            <th>
                                                Crowd Level
                                            </th>

                                            <th>
                                                Message
                                            </th>
                                        </>
                                    )}

                                    {reportType ===
                                        "all" && (
                                        <>
                                            <th>
                                                Category
                                            </th>

                                            <th>
                                                User
                                            </th>

                                            <th>
                                                Email
                                            </th>

                                            <th>
                                                Status
                                            </th>

                                            <th>
                                                Details
                                            </th>
                                        </>
                                    )}

                                </tr>

                            </thead>

                            <tbody>

                                {currentRows.map(
                                    (
                                        row,
                                        index
                                    ) => (
                                        <tr
                                            key={
                                                `${row.date}-${index}`
                                            }
                                        >

                                            <td>
                                                {formatDate(
                                                    row.date
                                                )}
                                            </td>

                                            <td>
                                                {formatTime(
                                                    row.date
                                                )}
                                            </td>

                                            {reportType ===
                                                "attendance" && (
                                                <>
                                                    <td className="report-user-cell">
                                                        {
                                                            row.name
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.email
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`report-status ${
                                                                String(
                                                                    row.status
                                                                ).toLowerCase() ===
                                                                "present"
                                                                    ? "success"
                                                                    : "neutral"
                                                            }`}
                                                        >
                                                            {
                                                                row.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>
                                                        {
                                                            row.method
                                                        }
                                                    </td>

                                                    <td>
                                                        {row.confidence
                                                            ? `${row.confidence.toFixed(
                                                                  2
                                                              )}%`
                                                            : "--"}
                                                    </td>
                                                </>
                                            )}

                                            {reportType ===
                                                "face" && (
                                                <>
                                                    <td className="report-user-cell">
                                                        {
                                                            row.name
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.email
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`report-status ${
                                                                row.status ===
                                                                "Successful"
                                                                    ? "success"
                                                                    : "danger"
                                                            }`}
                                                        >
                                                            {
                                                                row.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="report-description">
                                                        {
                                                            row.description
                                                        }
                                                    </td>
                                                </>
                                            )}

                                            {reportType ===
                                                "crowd" && (
                                                <>
                                                    <td>
                                                        {
                                                            row.faces
                                                        }
                                                    </td>

                                                    <td>
                                                        <span className="report-status neutral">
                                                            {
                                                                row.level
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="report-description">
                                                        {
                                                            row.message
                                                        }
                                                    </td>
                                                </>
                                            )}

                                            {reportType ===
                                                "all" && (
                                                <>
                                                    <td>
                                                        {
                                                            row.category
                                                        }
                                                    </td>

                                                    <td className="report-user-cell">
                                                        {
                                                            row.name
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            row.email
                                                        }
                                                    </td>

                                                    <td>
                                                        <span className="report-status neutral">
                                                            {
                                                                row.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="report-description">
                                                        {
                                                            row.details
                                                        }
                                                    </td>
                                                </>
                                            )}

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>
                    )}

                </div>

                <div className="reports-paper-footer">

                    <span>
                        FaceGuard AI
                        Administrative
                        Report
                    </span>

                    <span>
                        Total Records:
                        {" "}
                        {
                            currentRows.length
                        }
                    </span>

                </div>

            </div>

        </div>
    );
}

export default Reports;