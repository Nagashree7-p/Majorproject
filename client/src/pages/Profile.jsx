import { useEffect, useState } from "react";
import {
    UserCircle,
    Mail,
    ShieldCheck,
    CalendarDays,
    Save,
    Lock,
    Eye,
    EyeOff,
    Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

function Profile() {
    const [user, setUser] = useState({});
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(
            localStorage.getItem("user") || "{}"
        );

        setUser(storedUser);
        setName(storedUser.name || "");
        setEmail(storedUser.email || "");
    }, []);

    const updateProfile = async (event) => {
        event.preventDefault();

        if (!name.trim()) {
            toast.error("Name cannot be empty");
            return;
        }

        if (!email.trim()) {
            toast.error("Email cannot be empty");
            return;
        }

        if (password && password.length < 6) {
            toast.error(
                "Password must contain at least 6 characters"
            );
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await fetch(
                `http://localhost:5000/api/users/${user.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        email: email.trim(),
                        ...(password
                            ? { password }
                            : {})
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Unable to update profile"
                );
            }

            const updatedUser = {
                ...user,
                ...(data.user || {
                    name: name.trim(),
                    email: email.trim()
                })
            };

            localStorage.setItem(
                "user",
                JSON.stringify(updatedUser)
            );

            setUser(updatedUser);
            setName(updatedUser.name);
            setEmail(updatedUser.email);
            setPassword("");
            setConfirmPassword("");

            toast.success(
                "Profile updated successfully"
            );
        } catch (error) {
            console.error(
                "Profile update error:",
                error
            );

            toast.error(
                error.message ||
                    "Unable to update profile"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-modern-page">

            <div className="profile-modern-header">

                <div>

                    <div className="profile-title-row">
                        <div className="profile-title-icon">
                            <UserCircle size={22} />
                        </div>

                        <div>
                            <span className="profile-eyebrow">
                                ACCOUNT CENTER
                            </span>

                            <h1>
                                My Profile
                            </h1>
                        </div>
                    </div>

                    <p>
                        Manage your account information,
                        security and personal preferences.
                    </p>

                </div>

                <div className="profile-security-pill">
                    <ShieldCheck size={17} />
                    Account Secure
                </div>

            </div>

            <div className="profile-modern-grid">

                <div className="profile-overview-card">

                    <div className="profile-card-glow"></div>

                    <div className="profile-avatar-xl">
                        {name
                            ? name.charAt(0).toUpperCase()
                            : "U"}
                    </div>

                    <h2>
                        {name || "User"}
                    </h2>

                    <p className="profile-email-text">
                        {email || "No email available"}
                    </p>

                    <div className="profile-role-pill">

                        {user.role === "admin" ? (
                            <ShieldCheck size={15} />
                        ) : (
                            <UserCircle size={15} />
                        )}

                        {user.role === "admin"
                            ? "Administrator"
                            : "User"}

                    </div>

                    <div className="profile-overview-divider"></div>

                    <div className="profile-overview-item">

                        <div className="profile-overview-item-icon">
                            <Mail size={17} />
                        </div>

                        <div>
                            <span>
                                Email Address
                            </span>

                            <strong>
                                {email || "—"}
                            </strong>
                        </div>

                    </div>

                    <div className="profile-overview-item">

                        <div className="profile-overview-item-icon">
                            <CalendarDays size={17} />
                        </div>

                        <div>
                            <span>
                                Account Type
                            </span>

                            <strong>
                                FaceGuard AI Member
                            </strong>
                        </div>

                    </div>

                    <div className="profile-overview-item">

                        <div className="profile-overview-item-icon">
                            <ShieldCheck size={17} />
                        </div>

                        <div>
                            <span>
                                Security
                            </span>

                            <strong>
                                Protected Account
                            </strong>
                        </div>

                    </div>

                </div>

                <form
                    className="profile-details-card"
                    onSubmit={updateProfile}
                >

                    <div className="profile-details-header">

                        <div>

                            <div className="profile-section-label">
                                <Sparkles size={15} />
                                PERSONAL DETAILS
                            </div>

                            <h2>
                                Personal Information
                            </h2>

                            <p>
                                Update the information associated
                                with your account.
                            </p>

                        </div>

                    </div>

                    <div className="profile-form-grid">

                        <div className="profile-field">

                            <label>
                                Full Name
                            </label>

                            <div className="profile-modern-input">

                                <UserCircle size={18} />

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your full name"
                                />

                            </div>

                        </div>

                        <div className="profile-field">

                            <label>
                                Email Address
                            </label>

                            <div className="profile-modern-input">

                                <Mail size={18} />

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your email"
                                />

                            </div>

                        </div>

                    </div>

                    <div className="profile-security-section">

                        <div className="profile-security-heading">

                            <div className="profile-security-heading-icon">
                                <Lock size={18} />
                            </div>

                            <div>
                                <h3>
                                    Password & Security
                                </h3>

                                <p>
                                    Change your password to
                                    keep your account secure.
                                </p>
                            </div>

                        </div>

                        <div className="profile-password-grid">

                            <div className="profile-field">

                                <label>
                                    New Password
                                </label>

                                <div className="profile-modern-input">

                                    <Lock size={18} />

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter new password"
                                    />

                                    <button
                                        type="button"
                                        className="profile-password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                !showPassword
                                            )
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>

                            </div>

                            <div className="profile-field">

                                <label>
                                    Confirm Password
                                </label>

                                <div className="profile-modern-input">

                                    <Lock size={18} />

                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            confirmPassword
                                        }
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Confirm new password"
                                    />

                                    <button
                                        type="button"
                                        className="profile-password-toggle"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                    <div className="profile-form-footer">

                        <div className="profile-save-info">
                            <ShieldCheck size={16} />

                            <span>
                                Your information is securely
                                stored in MongoDB.
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="profile-save-btn"
                            disabled={loading}
                        >

                            <Save size={18} />

                            {loading
                                ? "Saving..."
                                : "Save Changes"}

                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export default Profile;