import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  ScanFace,
  Users,
  Radar,
  Activity,
  LockKeyhole
} from "lucide-react";

function Landing() {
  return (
    <div className="landing-page">

      <nav className="landing-navbar">
        <div className="landing-brand">
          <div className="landing-logo">
            <ShieldCheck size={28} />
          </div>

          <div>
            <h2>FaceGuard AI</h2>
            <span>FACE RECOGNITION • CROWD ANALYTICS</span>
          </div>
        </div>

        <div className="landing-nav-actions">
          <Link to="/login" className="landing-login">
            Login
          </Link>

          <Link to="/register" className="landing-register">
            Get Started
            <ArrowRight size={17} />
          </Link>
        </div>
      </nav>

      <main>

        <section className="landing-hero">

          <div className="landing-hero-content">

            <div className="landing-badge">
              <span className="landing-badge-dot"></span>
              AI-POWERED SECURITY PLATFORM
            </div>

            <h1>
              Smarter Security.
              <br />
              <span>Powered by AI.</span>
            </h1>

            <p>
              Advanced face recognition and real-time crowd analysis
              designed to provide secure authentication, automated
              attendance, and intelligent crowd monitoring.
            </p>

            <div className="landing-hero-actions">
              <Link to="/register" className="landing-primary-btn">
                Start Exploring
                <ArrowRight size={18} />
              </Link>

              <Link to="/login" className="landing-secondary-btn">
                Sign In
              </Link>
            </div>

            <div className="landing-security-note">
              <LockKeyhole size={16} />
              Secure AI-powered authentication
            </div>

          </div>

          <div className="landing-live-panel">

            <div className="live-panel-header">
              <div>
                <span className="live-title">
                  <span className="live-dot"></span>
                  LIVE AI SYSTEM
                </span>
                <h3>Intelligent Vision</h3>
              </div>

              <Activity size={22} />
            </div>

            <div className="live-grid">

              <div className="live-card">
                <div className="live-card-icon">
                  <ScanFace size={25} />
                </div>

                <strong>Face Authentication</strong>
                <span>Secure identity verification</span>

                <div className="live-status">
                  <span></span>
                  Active
                </div>
              </div>

              <div className="live-card">
                <div className="live-card-icon">
                  <Users size={25} />
                </div>

                <strong>Group Recognition</strong>
                <span>Multiple face identification</span>

                <div className="live-status">
                  <span></span>
                  Ready
                </div>
              </div>

              <div className="live-card">
                <div className="live-card-icon">
                  <Radar size={25} />
                </div>

                <strong>Crowd Analysis</strong>
                <span>Real-time crowd monitoring</span>

                <div className="live-status">
                  <span></span>
                  Monitoring
                </div>
              </div>

            </div>

            <div className="live-panel-footer">
              <span>AI ENGINE</span>
              <strong>ONLINE</strong>
            </div>

          </div>

        </section>

        <section className="landing-features">

          <div className="landing-section-heading">
            <span>CORE CAPABILITIES</span>
            <h2>Everything you need for intelligent security</h2>
            <p>
              A unified platform combining deep learning with modern
              web technologies.
            </p>
          </div>

          <div className="feature-grid">

            <div className="feature-card">
              <div className="feature-icon">
                <ScanFace size={27} />
              </div>

              <h3>Individual Authentication</h3>

              <p>
                Verify identities using advanced facial embeddings
                and AI-powered face matching.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={27} />
              </div>

              <h3>Group Recognition</h3>

              <p>
                Detect and recognize multiple registered individuals
                while automatically recording attendance.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Radar size={27} />
              </div>

              <h3>Crowd Analysis</h3>

              <p>
                Monitor crowd size and density using real-time
                computer vision and intelligent analysis.
              </p>
            </div>

          </div>

        </section>

      </main>

      <footer className="landing-footer">
        <div>
          <strong>FaceGuard AI</strong>
          <span>Intelligent Face Recognition & Crowd Analysis</span>
        </div>

        <p>© 2026 FaceGuard AI. All rights reserved.</p>
      </footer>

    </div>
  );
}

export default Landing;