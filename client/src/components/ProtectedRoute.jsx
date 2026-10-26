import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
    const location = useLocation();

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    let user;

    try {
        user = JSON.parse(savedUser);
    } catch (error) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const role = String(
        user?.role || "user"
    ).toLowerCase();

    const adminOnlyPaths = [
        "/group-authentication",
        "/crowd-analysis",
        "/analytics",
        "/reports",
        "/users",
        "/activity-logs"
    ];

    const adminOnly =
        adminOnlyPaths.includes(
            location.pathname
        );

    if (adminOnly && role !== "admin") {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;