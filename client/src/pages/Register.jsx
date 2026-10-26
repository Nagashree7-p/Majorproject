import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ScanFace,
    User,
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck
} from "lucide-react";
import axios from "axios";

function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");

        if (!name || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setLoading(true);

            const response = await axios.post(
                "http://localhost:5000/api/auth/register",
                {
                    name,
                    email,
                    password
                }
            );

            localStorage.setItem("token", response.data.token);

            localStorage.setItem(
                "user",
                JSON.stringify(response.data.user)
            );

            navigate("/dashboard");

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">

                <div className="auth-brand">
                    <div className="auth-logo">
                        <ScanFace size={30} />
                    </div>

                    <h1>FaceGuard AI</h1>
                    <p>Intelligent Face Recognition & Crowd Analysis</p>
                </div>

                <div className="auth-card">

                    <div className="auth-heading">
                        <h2>Create Account</h2>
                        <p>Join the intelligent security platform</p>
                    </div>

                    <form onSubmit={handleRegister}>

                        <div className="input-group">
                            <label>Full Name</label>

                            <div className="input-wrapper">
                                <User size={19} />

                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Email Address</label>

                            <div className="input-wrapper">
                                <Mail size={19} />

                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>

                            <div className="input-wrapper">
                                <Lock size={19} />

                                <input
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Confirm Password</label>

                            <div className="input-wrapper">
                                <Lock size={19} />

                                <input
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Creating Account..."
                                : "Create Account"}

                            {!loading && <ArrowRight size={19} />}
                        </button>

                    </form>

                    <div className="auth-divider">
                        <span>SECURE REGISTRATION</span>
                    </div>

                    <div className="security-info">
                        <ShieldCheck size={18} />
                        <span>
                            Your information is securely protected
                        </span>
                    </div>

                    <p className="auth-switch">
                        Already have an account?
                        <Link to="/login"> Sign In</Link>
                    </p>

                </div>

                <Link to="/" className="back-home">
                    ← Back to Home
                </Link>

            </div>
        </div>
    );
}

export default Register;