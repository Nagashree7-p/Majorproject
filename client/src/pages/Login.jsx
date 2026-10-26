import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ScanFace,
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!email || !password) {
            setError("Please enter email and password");
            return;
        }

        try {
            setLoading(true);

            await login(email, password);

            navigate("/dashboard");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Login failed. Please check your credentials."
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

                    <p>
                        Intelligent Face Recognition & Crowd Analysis
                    </p>

                </div>

                <div className="auth-card">

                    <div className="auth-heading">

                        <h2>Welcome Back</h2>

                        <p>
                            Sign in to access your dashboard
                        </p>

                    </div>

                    <form onSubmit={handleLogin}>

                        <div className="input-group">

                            <label>
                                Email Address
                            </label>

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

                            <label>
                                Password
                            </label>

                            <div className="input-wrapper">

                                <Lock size={19} />

                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />

                            </div>

                        </div>

                        {error && (
                            <div className="auth-error">
                                {error}
                            </div>
                        )}

                        <div className="auth-options">

                            <label className="remember">

                                <input type="checkbox" />

                                Remember me

                            </label>

                            <button
                                type="button"
                                className="forgot-button"
                            >
                                Forgot password?
                            </button>

                        </div>

                        <button
                            type="submit"
                            className="auth-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Signing In..."
                                : "Sign In"}

                            {!loading && (
                                <ArrowRight size={19} />
                            )}

                        </button>

                    </form>

                    <div className="auth-divider">
                        <span>
                            SECURE ACCESS
                        </span>
                    </div>

                    <div className="security-info">

                        <ShieldCheck size={18} />

                        <span>
                            Your account is protected with secure authentication
                        </span>

                    </div>

                    <p className="auth-switch">

                        Don't have an account?

                        <Link to="/register">
                            {" "}Create Account
                        </Link>

                    </p>

                </div>

                <Link
                    to="/"
                    className="back-home"
                >
                    ← Back to Home
                </Link>

            </div>

        </div>
    );
}

export default Login;