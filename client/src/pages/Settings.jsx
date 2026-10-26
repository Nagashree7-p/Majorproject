import { useEffect, useMemo, useState } from "react";
import {
    Settings as SettingsIcon,
    Bell,
    ShieldCheck,
    Moon,
    Sun,
    Database,
    Save,
    RotateCcw,
    Sparkles,
    RefreshCw,
    Lock,
    CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function Settings() {
    const { user } = useAuth();

    const currentUserId =
        user?.id || user?._id;

    const settingsKey =
        currentUserId
            ? `faceguardSettings_${currentUserId}`
            : "faceguardSettings";

    const defaultSettings = {
        notifications: true,
        securityAlerts: true,
        darkMode: false,
        autoRefresh: true
    };

    const [notifications, setNotifications] =
        useState(defaultSettings.notifications);

    const [securityAlerts, setSecurityAlerts] =
        useState(defaultSettings.securityAlerts);

    const [darkMode, setDarkMode] =
        useState(defaultSettings.darkMode);

    const [autoRefresh, setAutoRefresh] =
        useState(defaultSettings.autoRefresh);

    const [savedSettings, setSavedSettings] =
        useState(defaultSettings);

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {
        const storedSettings =
            localStorage.getItem(
                settingsKey
            );

        let loadedSettings =
            defaultSettings;

        if (storedSettings) {
            try {
                const parsedSettings =
                    JSON.parse(
                        storedSettings
                    );

                loadedSettings = {
                    ...defaultSettings,
                    ...parsedSettings
                };
            } catch (error) {
                console.error(
                    "Unable to load settings:",
                    error
                );
            }
        }

        setNotifications(
            loadedSettings.notifications
        );

        setSecurityAlerts(
            loadedSettings.securityAlerts
        );

        setDarkMode(
            loadedSettings.darkMode
        );

        setAutoRefresh(
            loadedSettings.autoRefresh
        );

        setSavedSettings(
            loadedSettings
        );

        applyTheme(
            loadedSettings.darkMode
        );
    }, [settingsKey]);

    const applyTheme = (isDark) => {
        document.body.classList.toggle(
            "light-mode",
            !isDark
        );

        document.body.classList.toggle(
            "dark-mode",
            isDark
        );
    };

    const currentSettings = useMemo(
        () => ({
            notifications,
            securityAlerts,
            darkMode,
            autoRefresh
        }),
        [
            notifications,
            securityAlerts,
            darkMode,
            autoRefresh
        ]
    );

    const hasUnsavedChanges =
        JSON.stringify(
            currentSettings
        ) !==
        JSON.stringify(
            savedSettings
        );

    const saveSettings = async () => {
        try {
            setSaving(true);

            const settingsToSave = {
                notifications,
                securityAlerts,
                darkMode,
                autoRefresh
            };

            localStorage.setItem(
                settingsKey,
                JSON.stringify(
                    settingsToSave
                )
            );

            setSavedSettings(
                settingsToSave
            );

            applyTheme(
                settingsToSave.darkMode
            );

            setTimeout(() => {
                setSaving(false);

                toast.success(
                    "Settings saved successfully"
                );
            }, 500);
        } catch (error) {
            console.error(
                "Settings save error:",
                error
            );

            setSaving(false);

            toast.error(
                "Unable to save settings"
            );
        }
    };

    const resetSettings = () => {
        setNotifications(
            defaultSettings.notifications
        );

        setSecurityAlerts(
            defaultSettings.securityAlerts
        );

        setDarkMode(
            defaultSettings.darkMode
        );

        setAutoRefresh(
            defaultSettings.autoRefresh
        );

        toast.success(
            "Default settings loaded. Click Save Settings to apply."
        );
    };

    const Toggle = ({
        checked,
        onChange
    }) => (
        <button
            type="button"
            className={`settings-modern-toggle ${
                checked
                    ? "active"
                    : ""
            }`}
            onClick={() =>
                onChange(!checked)
            }
            disabled={saving}
        >
            <span></span>
        </button>
    );

    return (
        <div className="settings-modern-page">

            <div className="settings-modern-header">

                <div>

                    <div className="settings-title-row">

                        <div className="settings-title-icon">
                            <SettingsIcon size={22} />
                        </div>

                        <div>

                            <span className="settings-eyebrow">
                                SYSTEM CONFIGURATION
                            </span>

                            <h1>
                                Settings
                            </h1>

                        </div>

                    </div>

                    <p>
                        Customize FaceGuard AI behavior,
                        notifications and monitoring preferences.
                    </p>

                </div>

                <div className="settings-system-pill">
                    <ShieldCheck size={17} />
                    System Secure
                </div>

            </div>

            {hasUnsavedChanges && (

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "18px",
                        padding: "11px 14px",
                        borderRadius: "12px",
                        border: "1px solid rgba(239, 178, 70, 0.2)",
                        background:
                            "rgba(239, 178, 70, 0.08)",
                        color: "#e8bd67",
                        fontSize: "12px",
                        fontWeight: "600"
                    }}
                >
                    <AlertCircleIcon />
                    You have unsaved changes.
                    Click Save Settings to apply them.
                </div>

            )}

            <div className="settings-modern-grid">

                <div className="settings-modern-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-heading-icon">
                            <Bell size={19} />
                        </div>

                        <div>

                            <span>
                                COMMUNICATION
                            </span>

                            <h2>
                                Notifications
                            </h2>

                            <p>
                                Control alerts and system
                                notifications.
                            </p>

                        </div>

                    </div>

                    <div className="settings-modern-option">

                        <div className="settings-option-icon">
                            <Bell size={18} />
                        </div>

                        <div className="settings-option-content">

                            <strong>
                                System Notifications
                            </strong>

                            <span>
                                Receive important application
                                notifications and updates.
                            </span>

                        </div>

                        <Toggle
                            checked={
                                notifications
                            }
                            onChange={
                                setNotifications
                            }
                        />

                    </div>

                    <div className="settings-modern-option">

                        <div className="settings-option-icon alert-icon">
                            <ShieldCheck size={18} />
                        </div>

                        <div className="settings-option-content">

                            <strong>
                                Security Alerts
                            </strong>

                            <span>
                                Get notified about security
                                events and unknown faces.
                            </span>

                        </div>

                        <Toggle
                            checked={
                                securityAlerts
                            }
                            onChange={
                                setSecurityAlerts
                            }
                        />

                    </div>

                </div>

                <div className="settings-modern-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-heading-icon">
                            <ShieldCheck size={19} />
                        </div>

                        <div>

                            <span>
                                PROTECTION
                            </span>

                            <h2>
                                Security
                            </h2>

                            <p>
                                FaceGuard AI engine status.
                            </p>

                        </div>

                    </div>

                    <div className="settings-status-option">

                        <div className="settings-option-icon success-icon">
                            <ShieldCheck size={18} />
                        </div>

                        <div className="settings-option-content">

                            <strong>
                                AI Security Engine
                            </strong>

                            <span>
                                Face recognition services
                                are connected.
                            </span>

                        </div>

                        <div className="settings-online-badge">
                            <span></span>
                            Online
                        </div>

                    </div>

                    <div className="settings-status-option">

                        <div className="settings-option-icon success-icon">
                            <Lock size={18} />
                        </div>

                        <div className="settings-option-content">

                            <strong>
                                Authentication System
                            </strong>

                            <span>
                                JWT authentication and protected
                                routes are active.
                            </span>

                        </div>

                        <div className="settings-online-badge">
                            <span></span>
                            Protected
                        </div>

                    </div>

                </div>

                <div className="settings-modern-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-heading-icon">

                            {darkMode ? (
                                <Moon size={19} />
                            ) : (
                                <Sun size={19} />
                            )}

                        </div>

                        <div>

                            <span>
                                DISPLAY
                            </span>

                            <h2>
                                Appearance
                            </h2>

                            <p>
                                Customize the interface behavior.
                            </p>

                        </div>

                    </div>

                    <div className="settings-modern-option">

                        <div className="settings-option-icon">

                            {darkMode ? (
                                <Moon size={18} />
                            ) : (
                                <Sun size={18} />
                            )}

                        </div>

                        <div className="settings-option-content">

                            <strong>
                                Dark Mode
                            </strong>

                            <span>
                                Changes will be applied
                                after you save settings.
                            </span>

                        </div>

                        <Toggle
                            checked={
                                darkMode
                            }
                            onChange={
                                setDarkMode
                            }
                        />

                    </div>

                    <div className="settings-modern-option">

                        <div className="settings-option-icon">
                            <RefreshCw size={18} />
                        </div>

                        <div className="settings-option-content">

                            <strong>
                                Automatic Data Refresh
                            </strong>

                            <span>
                                Automatically refresh supported
                                dashboard information.
                            </span>

                        </div>

                        <Toggle
                            checked={
                                autoRefresh
                            }
                            onChange={
                                setAutoRefresh
                            }
                        />

                    </div>

                </div>

                <div className="settings-modern-card">

                    <div className="settings-card-heading">

                        <div className="settings-card-heading-icon">
                            <Database size={19} />
                        </div>

                        <div>

                            <span>
                                PLATFORM
                            </span>

                            <h2>
                                System Information
                            </h2>

                            <p>
                                Current FaceGuard AI technology stack.
                            </p>

                        </div>

                    </div>

                    <div className="settings-info-grid">

                        <div className="settings-info-box">
                            <span>
                                Platform
                            </span>
                            <strong>
                                FaceGuard AI
                            </strong>
                        </div>

                        <div className="settings-info-box">
                            <span>
                                Recognition
                            </span>
                            <strong>
                                ArcFace
                            </strong>
                        </div>

                        <div className="settings-info-box">
                            <span>
                                Frontend
                            </span>
                            <strong>
                                React.js
                            </strong>
                        </div>

                        <div className="settings-info-box">
                            <span>
                                Backend
                            </span>
                            <strong>
                                Node.js + Express
                            </strong>
                        </div>

                        <div className="settings-info-box">
                            <span>
                                Database
                            </span>
                            <strong>
                                MongoDB
                            </strong>
                        </div>

                        <div className="settings-info-box">
                            <span>
                                AI Engine
                            </span>
                            <strong>
                                Python + Flask
                            </strong>
                        </div>

                    </div>

                </div>

            </div>

            <div className="settings-modern-footer">

                <div className="settings-footer-info">

                    <div className="settings-footer-icon">
                        <Sparkles size={17} />
                    </div>

                    <div>

                        <strong>
                            FaceGuard AI Preferences
                        </strong>

                        <span>
                            Preferences are stored separately
                            for each account on this device.
                        </span>

                    </div>

                </div>

                <div className="settings-footer-actions">

                    <button
                        type="button"
                        className="settings-reset-btn"
                        onClick={
                            resetSettings
                        }
                        disabled={
                            saving
                        }
                    >
                        <RotateCcw size={17} />

                        Reset Defaults
                    </button>

                    <button
                        type="button"
                        className="settings-save-btn"
                        onClick={
                            saveSettings
                        }
                        disabled={
                            saving ||
                            !hasUnsavedChanges
                        }
                    >

                        {saving ? (
                            <RefreshCw
                                size={17}
                                className="spin"
                            />
                        ) : (
                            <Save size={17} />
                        )}

                        {saving
                            ? "Saving..."
                            : "Save Settings"}

                    </button>

                </div>

            </div>

        </div>
    );
}

function AlertCircleIcon() {
    return (
        <span
            style={{
                width: "16px",
                height: "16px",
                border: "2px solid currentColor",
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "800"
            }}
        >
            !
        </span>
    );
}

export default Settings;