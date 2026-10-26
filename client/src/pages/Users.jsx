import { useEffect, useState } from "react";
import {
    Search,
    UserPlus,
    ShieldCheck,
    User,
    Mail,
    CalendarDays,
    MoreVertical,
    Users as UsersIcon,
    RefreshCw
} from "lucide-react";
import axios from "axios";

function Users() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5000/api/users",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setUsers(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setUsers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filteredUsers = users.filter((user) =>
        `${user.name || ""} ${user.email || ""} ${user.role || ""}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    const adminCount = users.filter(
        (user) => user.role === "admin"
    ).length;

    const regularUserCount = users.filter(
        (user) => user.role === "user"
    ).length;

    return (
        <div className="users-page">

            <div className="page-header">

                <div>
                    <span className="page-eyebrow">
                        USER MANAGEMENT
                    </span>

                    <h2>Users</h2>

                    <p>
                        Manage registered users and access permissions.
                    </p>
                </div>

                <button
                    className="primary-action"
                    onClick={() => fetchUsers(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={18}
                        className={
                            refreshing
                                ? "refresh-spinning"
                                : ""
                        }
                    />
                    {refreshing ? "Refreshing..." : "Refresh Users"}
                </button>

            </div>

            <div className="user-stat-grid">

                <div className="user-stat-card">

                    <div className="user-stat-icon">
                        <UsersIcon size={22} />
                    </div>

                    <div>
                        <span>Total Users</span>
                        <strong>{users.length}</strong>
                    </div>

                </div>

                <div className="user-stat-card">

                    <div className="user-stat-icon">
                        <ShieldCheck size={22} />
                    </div>

                    <div>
                        <span>Administrators</span>
                        <strong>{adminCount}</strong>
                    </div>

                </div>

                <div className="user-stat-card">

                    <div className="user-stat-icon">
                        <User size={22} />
                    </div>

                    <div>
                        <span>Regular Users</span>
                        <strong>{regularUserCount}</strong>
                    </div>

                </div>

            </div>

            <div className="users-card">

                <div className="users-toolbar">

                    <div>
                        <h3>Registered Users</h3>

                        <p>
                            All users registered in FaceGuard AI
                        </p>
                    </div>

                    <div className="users-search">

                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                        />

                    </div>

                </div>

                {loading ? (

                    <div className="users-empty">

                        <div className="loading-spinner"></div>

                        <p>
                            Loading users...
                        </p>

                    </div>

                ) : filteredUsers.length === 0 ? (

                    <div className="users-empty">

                        <UsersIcon size={45} />

                        <h3>
                            No users found
                        </h3>

                        <p>
                            {search
                                ? "Try a different search."
                                : "No registered users are available."}
                        </p>

                    </div>

                ) : (

                    <div className="users-table-wrapper">

                        <table className="users-table">

                            <thead>

                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>

                            </thead>

                            <tbody>

                                {filteredUsers.map((user) => (

                                    <tr key={user._id}>

                                        <td>

                                            <div className="user-cell">

                                                <div className="user-avatar">
                                                    {user.name
                                                        ?.charAt(0)
                                                        .toUpperCase() || "U"}
                                                </div>

                                                <div>

                                                    <strong>
                                                        {user.name || "Unknown User"}
                                                    </strong>

                                                    <span>
                                                        User ID:{" "}
                                                        {user._id
                                                            ? user._id.slice(-6)
                                                            : "—"}
                                                    </span>

                                                </div>

                                            </div>

                                        </td>

                                        <td>

                                            <div className="email-cell">

                                                <Mail size={16} />

                                                {user.email || "—"}

                                            </div>

                                        </td>

                                        <td>

                                            <span
                                                className={`role-badge ${
                                                    user.role === "admin"
                                                        ? "admin"
                                                        : "user"
                                                }`}
                                            >

                                                {user.role === "admin" ? (
                                                    <ShieldCheck size={14} />
                                                ) : (
                                                    <User size={14} />
                                                )}

                                                {user.role || "user"}

                                            </span>

                                        </td>

                                        <td>

                                            <div className="date-cell">

                                                <CalendarDays size={15} />

                                                {user.createdAt
                                                    ? new Date(
                                                          user.createdAt
                                                      ).toLocaleDateString()
                                                    : "—"}

                                            </div>

                                        </td>

                                        <td>

                                            <span className="status-badge">

                                                <span></span>

                                                Active

                                            </span>

                                        </td>

                                        <td>

                                            <button className="table-menu">

                                                <MoreVertical size={18} />

                                            </button>

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default Users;