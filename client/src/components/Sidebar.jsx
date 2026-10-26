import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    ScanFace,
    Users,
    Camera,
    ClipboardCheck,
    BarChart3,
    FileText,
    UserCog,
    Activity,
    User,
    Settings,
    LogOut,
    ShieldCheck,
    UserRoundPlus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const isAdmin =
        String(user?.role || "user").toLowerCase() === "admin";

    const menuItems = isAdmin
        ? [
            {
                title: "Main",
                items: [
                    {
                        name: "Dashboard",
                        path: "/dashboard",
                        icon: LayoutDashboard
                    },
                    {
                        name: "Face Authentication",
                        path: "/face-authentication",
                        icon: ScanFace
                    },
                    {
                        name: "Face Registration",
                        path: "/face-registration",
                        icon: UserRoundPlus
                    },
                    {
                        name: "Group Authentication",
                        path: "/group-authentication",
                        icon: Users
                    },
                    {
                        name: "Crowd Analysis",
                        path: "/crowd-analysis",
                        icon: Camera
                    }
                ]
            },
            {
                title: "Management",
                items: [
                    {
                        name: "Attendance",
                        path: "/attendance",
                        icon: ClipboardCheck
                    },
                    {
                        name: "Analytics",
                        path: "/analytics",
                        icon: BarChart3
                    },
                    {
                        name: "Reports",
                        path: "/reports",
                        icon: FileText
                    },
                    {
                        name: "Users",
                        path: "/users",
                        icon: UserCog
                    },
                    {
                        name: "Activity Logs",
                        path: "/activity-logs",
                        icon: Activity
                    }
                ]
            },
            {
                title: "Account",
                items: [
                    {
                        name: "Profile",
                        path: "/profile",
                        icon: User
                    },
                    {
                        name: "Settings",
                        path: "/settings",
                        icon: Settings
                    }
                ]
            }
        ]
        : [
            {
                title: "Main",
                items: [
                    {
                        name: "Dashboard",
                        path: "/dashboard",
                        icon: LayoutDashboard
                    },
                    {
                        name: "Face Authentication",
                        path: "/face-authentication",
                        icon: ScanFace
                    },
                    {
                        name: "Face Registration",
                        path: "/face-registration",
                        icon: UserRoundPlus
                    }
                ]
            },
            {
                title: "Personal",
                items: [
                    {
                        name: "My Attendance",
                        path: "/attendance",
                        icon: ClipboardCheck
                    }
                ]
            },
            {
                title: "Account",
                items: [
                    {
                        name: "Profile",
                        path: "/profile",
                        icon: User
                    },
                    {
                        name: "Settings",
                        path: "/settings",
                        icon: Settings
                    }
                ]
            }
        ];

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="sidebar">

            <div className="sidebar-brand">

                <div className="sidebar-logo">
                    <ScanFace size={26} />
                </div>

                <div>
                    <h2>FaceGuard</h2>
                    <span>AI SECURITY</span>
                </div>

            </div>

            <div className="sidebar-user">

                <div className="sidebar-user-avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div className="sidebar-user-info">

                    <strong>
                        {user?.name || "User"}
                    </strong>

                    <span>
                        {isAdmin ? "Admin" : "User"}
                    </span>

                </div>

                <ShieldCheck size={17} />

            </div>

            <nav className="sidebar-nav">

                {menuItems.map((section) => (
                    <div
                        className="sidebar-section"
                        key={section.title}
                    >

                        <div className="sidebar-section-title">
                            {section.title}
                        </div>

                        {section.items.map((item) => {

                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        isActive
                                            ? "sidebar-link active"
                                            : "sidebar-link"
                                    }
                                >
                                    <Icon size={19} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}

                    </div>
                ))}

            </nav>

            <div className="sidebar-bottom">

                <div className="sidebar-security">

                    <div className="security-dot"></div>

                    <div>
                        <strong>System Secure</strong>
                        <span>All services operational</span>
                    </div>

                </div>

                <button
                    className="sidebar-logout"
                    onClick={handleLogout}
                >
                    <LogOut size={19} />
                    <span>Logout</span>
                </button>

            </div>

        </aside>
    );
}

export default Sidebar;