"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Mail, ShieldCheck, Camera,
    BadgeCheck, Clock, Crown, Activity,
    CalendarDays, KeyRound,
} from "lucide-react";
import { updateAvatarAction, signOutAction } from "@/actions/profile";

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

    const handleSignOut = () => {}; // Sign-out is handled by the sidebar

    const fields = [
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
            note: "Contact system owner to reset.",
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

        </div>
    );
}