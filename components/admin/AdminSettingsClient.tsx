"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Mail, ShieldCheck, Camera,
    BadgeCheck, Clock, Crown, Activity,
    CalendarDays, KeyRound, Edit, X, Eye, EyeOff
} from "lucide-react";
import { updateAvatarAction, signOutAction, updatePasswordAction } from "@/actions/profile";

interface Props {
    userId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    initials: string;
    memberSince: string;
    emailVerified: boolean;
    createdAt: string;
}

export default function AdminSettingsClient({
    userId, fullName, email, avatarUrl,
    initials, memberSince, emailVerified, createdAt,
}: Props) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatar, setAvatar] = useState<string | null>(avatarUrl);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [showPasswords, setShowPasswords] = useState(false);

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { setUploadError("Please select a valid image file."); return; }
        if (file.size > 5 * 1024 * 1024) { setUploadError("Image must be under 5MB."); return; }
        setUploadError(null);
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: "POST", body: fd }
            );
            if (!res.ok) throw new Error("Upload failed.");
            const data = await res.json();
            const url: string = data.secure_url;
            const result = await updateAvatarAction(userId, url);
            if (result?.error) throw new Error(result.error);
            setAvatar(url);
            router.refresh();
        } catch (err: any) {
            setUploadError(err.message ?? "Upload failed. Please try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handlePasswordSubmit = () => {
        setPasswordError("");
        setPasswordSuccess("");
        if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
            setPasswordError("Please fill out all fields.");
            return;
        }
        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordError("New passwords do not match.");
            return;
        }
        if (passwordForm.new.length < 8) {
            setPasswordError("New password must be at least 8 characters.");
            return;
        }
        startTransition(async () => {
            const res = await updatePasswordAction(userId, passwordForm.current, passwordForm.new);
            if (res.error) {
                setPasswordError(res.error);
            } else {
                setPasswordSuccess("Password updated successfully.");
                setPasswordForm({ current: "", new: "", confirm: "" });
                setTimeout(() => {
                    setIsPasswordModalOpen(false);
                    setPasswordSuccess("");
                }, 2000);
            }
        });
    };

    const handleSignOut = () => { }; // Sign-out is handled by the sidebar

    type ProfileField = {
        icon: React.ReactNode;
        label: string;
        value: string;
        mono?: boolean;
        badge?: { text: string; cls: string; Icon: React.ElementType };
        note?: string;
        action?: React.ReactNode;
    };

    const fields: ProfileField[] = [
        {
            icon: <Mail size={15} aria-hidden />,
            label: "Email Address",
            value: email,
            badge: emailVerified
                ? { text: "Verified", cls: "profile-badge--verified", Icon: BadgeCheck }
                : { text: "Unverified", cls: "profile-badge--unverified", Icon: Clock },
        },
        {
            icon: <ShieldCheck size={15} aria-hidden />,
            label: "Role",
            value: "Administrator",
            badge: { text: "Admin", cls: "profile-badge--admin", Icon: Crown },
        },
        {
            icon: <CalendarDays size={15} aria-hidden />,
            label: "Member Since",
            value: memberSince,
            mono: true,
        },
        {
            icon: <Activity size={15} aria-hidden />,
            label: "Console Access",
            value: "Full administrative access",
        },
        {
            icon: <KeyRound size={15} aria-hidden />,
            label: "Password",
            value: "••••••••••••",
            mono: true,
            action: (
                <button
                    className="adminusers__icon-btn edit-btn"
                    style={{ marginLeft: "10px", verticalAlign: "middle", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}
                    onClick={() => setIsPasswordModalOpen(true)}
                    title="Change Password"
                >
                    <Edit size={14} />
                </button>
            ),
        },
    ];

    return (
        <div className="profile">

            {/* ── Header ── */}
            <header className="profile__header">
                <div>
                    <p className="profile__pretitle">Console Settings</p>
                    <h1 className="profile__title">Admin Profile</h1>
                </div>
            </header>

            {/* ── Identity card ── */}
            <div className="profile__card">
                <div className="profile__avatar-wrap">
                    <button
                        className="profile__avatar"
                        onClick={handleAvatarClick}
                        disabled={uploading}
                        aria-label="Upload profile picture"
                    >
                        {avatar
                            ? <img src={avatar} alt={fullName} className="profile__avatar-img" />
                            : <span className="profile__avatar-initials">{initials}</span>
                        }
                        <div className="profile__avatar-overlay" aria-hidden>
                            {uploading
                                ? <span className="profile__avatar-spinner" />
                                : <Camera size={18} />
                            }
                        </div>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="profile__file-input"
                        onChange={handleFileChange}
                        aria-hidden
                        tabIndex={-1}
                    />
                    {uploadError && (
                        <p className="profile__upload-error" role="alert">{uploadError}</p>
                    )}
                </div>

                <div className="profile__identity">
                    <div className="profile__identity-name">
                        <h2>{fullName}</h2>
                        <span className="profile__role profile__role--admin">
                            <Crown size={11} aria-hidden />
                            Administrator
                        </span>
                    </div>
                    <p className="profile__member-since">Console access since {memberSince}</p>
                </div>
            </div>

            {/* ── Fields ── */}
            <div className="profile__fields">
                {fields.map(field => (
                    <div key={field.label} className="profile__field">
                        <div className="profile__field-label">
                            {field.icon}
                            <span>{field.label}</span>
                        </div>
                        <div className="profile__field-value-row">
                            <span className={`profile__field-value${field.mono ? " profile__field-value--mono" : ""}`}>
                                {field.value}
                            </span>
                            {field.badge && (
                                <span className={`profile-badge ${field.badge.cls}`}>
                                    <field.badge.Icon size={10} aria-hidden />
                                    {field.badge.text}
                                </span>
                            )}
                            {field.action}
                            {field.note && (
                                <span className="profile__field-note">{field.note}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <p className="profile__notice">
                Admin credentials are managed by the system owner. To update your email or
                password, contact{" "}
                <a href="mailto:support@goldenprivatewealth.com">
                    support@goldenprivatewealth.com
                </a>.
            </p>

            {/* ── Password Modal ── */}
            {isPasswordModalOpen && (
                <div className="tx-modal-backdrop" onClick={() => { setIsPasswordModalOpen(false); setPasswordError(""); setPasswordSuccess(""); setPasswordForm({ current: "", new: "", confirm: "" }); }} role="dialog" aria-modal="true" aria-label="Change Password">
                    <div className="tx-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>

                        {/* Header */}
                        <div className="tx-modal__header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--space-3)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-gold-400)" }}>
                                    <KeyRound size={16} />
                                    <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                        Security Update
                                    </span>
                                </div>
                                <button className="tx-modal__close" onClick={() => { setIsPasswordModalOpen(false); setPasswordError(""); setPasswordSuccess(""); setPasswordForm({ current: "", new: "", confirm: "" }); }} aria-label="Close modal">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Hero style title */}
                            <div style={{ width: "100%", textAlign: "center", padding: "var(--space-2) 0 var(--space-2)" }}>
                                <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "var(--space-1)" }}>
                                    Action Required
                                </p>
                                <p style={{
                                    fontFamily: "var(--font-display)", fontSize: "var(--font-size-2xl)",
                                    fontWeight: 300, letterSpacing: "-0.02em",
                                    color: "var(--color-text-primary)",
                                }}>
                                    Change Password
                                </p>
                            </div>
                        </div>

                        {/* Details list as Form */}
                        <div className="tx-modal__list-wrap" style={{ padding: "var(--space-4) var(--space-6) var(--space-6)" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-5)" }}>
                                
                                {passwordError && <div style={{ color: "#f87171", fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", letterSpacing: "0.05em", textAlign: "center", marginBottom: "var(--space-4)", background: "rgba(248, 113, 113, 0.1)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", border: "1px solid rgba(248, 113, 113, 0.3)" }}>{passwordError}</div>}
                                {passwordSuccess && <div style={{ color: "#34d399", fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", letterSpacing: "0.05em", textAlign: "center", marginBottom: "var(--space-4)", background: "rgba(52, 211, 153, 0.1)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", border: "1px solid rgba(52, 211, 153, 0.3)" }}>{passwordSuccess}</div>}

                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                                    <label style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Current Password</label>
                                    <div style={{ position: "relative" }}>
                                        <input 
                                            type={showPasswords ? "text" : "password"} 
                                            value={passwordForm.current} 
                                            onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} 
                                            placeholder="Enter current password"
                                            style={{ 
                                                width: "100%", padding: "var(--space-3) var(--space-4)", paddingRight: "40px",
                                                background: "rgba(13, 17, 32, 0.6)", border: "1px solid var(--color-border)", 
                                                borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", 
                                                fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", outline: "none",
                                                letterSpacing: "0.1em"
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => !p)}
                                            aria-label={showPasswords ? "Hide password" : "Show password"}
                                            style={{
                                                position: "absolute", right: "var(--space-3)", top: "50%", transform: "translateY(-50%)",
                                                background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)",
                                                display: "flex", alignItems: "center", padding: "var(--space-1)"
                                            }}
                                        >
                                            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                                    <label style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>New Password</label>
                                    <div style={{ position: "relative" }}>
                                        <input 
                                            type={showPasswords ? "text" : "password"} 
                                            value={passwordForm.new} 
                                            onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} 
                                            placeholder="Min. 8 characters"
                                            style={{ 
                                                width: "100%", padding: "var(--space-3) var(--space-4)", paddingRight: "40px",
                                                background: "rgba(13, 17, 32, 0.6)", border: "1px solid var(--color-border)", 
                                                borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", 
                                                fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", outline: "none",
                                                letterSpacing: "0.1em"
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => !p)}
                                            aria-label={showPasswords ? "Hide password" : "Show password"}
                                            style={{
                                                position: "absolute", right: "var(--space-3)", top: "50%", transform: "translateY(-50%)",
                                                background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)",
                                                display: "flex", alignItems: "center", padding: "var(--space-1)"
                                            }}
                                        >
                                            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                                
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
                                    <label style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Confirm New Password</label>
                                    <div style={{ position: "relative" }}>
                                        <input 
                                            type={showPasswords ? "text" : "password"} 
                                            value={passwordForm.confirm} 
                                            onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} 
                                            placeholder="Confirm new password"
                                            style={{ 
                                                width: "100%", padding: "var(--space-3) var(--space-4)", paddingRight: "40px",
                                                background: "rgba(13, 17, 32, 0.6)", border: "1px solid var(--color-border)", 
                                                borderRadius: "var(--radius-md)", color: "var(--color-text-primary)", 
                                                fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", outline: "none",
                                                letterSpacing: "0.1em"
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(p => !p)}
                                            aria-label={showPasswords ? "Hide password" : "Show password"}
                                            style={{
                                                position: "absolute", right: "var(--space-3)", top: "50%", transform: "translateY(-50%)",
                                                background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)",
                                                display: "flex", alignItems: "center", padding: "var(--space-1)"
                                            }}
                                        >
                                            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-5)" }}>
                                    <button onClick={() => { setIsPasswordModalOpen(false); setPasswordError(""); setPasswordSuccess(""); setPasswordForm({ current: "", new: "", confirm: "" }); }} style={{ padding: "var(--space-2) var(--space-5)", borderRadius: "var(--radius-full)", background: "transparent", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.2s" }}>Cancel</button>
                                    <button onClick={handlePasswordSubmit} disabled={isPending} style={{ padding: "var(--space-2) var(--space-6)", borderRadius: "var(--radius-full)", background: "var(--color-navy-800)", color: "var(--color-gold-300)", border: "1px solid var(--color-gold-700)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", transition: "all 0.2s", boxShadow: "0 0 12px rgba(196, 149, 32, 0.15)" }}>
                                        {isPending ? "Saving..." : "Save Password"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}