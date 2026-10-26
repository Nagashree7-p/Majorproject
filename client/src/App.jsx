import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import FaceAuthentication from "./pages/FaceAuthentication";
import GroupAuthentication from "./pages/GroupAuthentication";
import CrowdAnalysis from "./pages/CrowdAnalysis";
import Attendance from "./pages/Attendance";
import Users from "./pages/Users";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import ActivityLogs from "./pages/ActivityLogs";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import FaceRegistration from "./pages/FaceRegistration";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<DashboardLayout />}>

                        <Route
                            path="/dashboard"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/face-authentication"
                            element={<FaceAuthentication />}
                        />

                        <Route
                            path="/group-authentication"
                            element={<GroupAuthentication />}
                        />

                        <Route
                            path="/crowd-analysis"
                            element={<CrowdAnalysis />}
                        />

                        <Route
                            path="/attendance"
                            element={<Attendance />}
                        />

                        <Route
                            path="/users"
                            element={<Users />}
                        />

                        <Route
                            path="/analytics"
                            element={<Analytics />}
                        />

                        <Route
                            path="/reports"
                            element={<Reports />}
                        />

                        <Route
                            path="/activity-logs"
                            element={<ActivityLogs />}
                        />

                        <Route
                            path="/profile"
                            element={<Profile />}
                        />

                        <Route
                            path="/settings"
                            element={<Settings />}
                        />

                        <Route
                            path="/face-registration"
                            element={<FaceRegistration />}
                        />

                    </Route>
                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;