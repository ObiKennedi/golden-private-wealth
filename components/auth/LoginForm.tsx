"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginAction } from "@/actions/auth";

export default function LoginForm() {
    const searchParams = useSearchParams();
    const [state, formAction, isPending] = useActionState(loginAction, null);
    const [showPassword, setShowPassword] = useState(false);
    const isResetSuccess = searchParams.get("reset") === "success";

    return (
        <main className="auth-page-wrapper">
            <div className="auth-card-container">

                {/* Editorial Header */}
                <div className="auth-header-block">
                    <span className="auth-pretitle">Credential Verification</span>
                    <h1 className="auth-title">Access Sovereign Vault</h1>
                    <p className="auth-subtitle">
                        Enter your private security credentials to authenticate your connection.
                    </p>
                </div>

                {/* The Action Form */}
                <form action={formAction} className="auth-form-element">

                    {/* Global Alert Notification Banner */}
                    {state?.globalError && (
                        <div className="auth-alert-banner alert-error" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>{state.globalError}</p>
                        </div>
                    )}

                    {/* Success Banner from Passphrase Reset Redirects */}
                    {isResetSuccess && !state?.globalError && (
                        <div className="auth-alert-banner alert-success" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>Security signature updated successfully. Authenticate with your new password.</p>
                        </div>
                    )}

                    {/* Email Input Field */}
                    <div className="form-input-wrapper">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="e.g., sterling@vault.com"
                            disabled={isPending}
                            required
                        />
                        {state?.error?.email && (
                            <span className="form-field-error" aria-live="polite">
                                {state.error.email[0]}
                            </span>
                        )}
                    </div>

                    {/* Password Input Field */}
                    <div className="form-input-wrapper">
                        <div className="label-row-split">
                            <label htmlFor="password">Security Password</label>
                            <Link href="/forgot-password" className="input-side-link">
                                Forgot Passphrase?
                            </Link>
                        </div>
                        <div style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="••••••••••••"
                                disabled={isPending}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(p => !p)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                style={{
                                    position: "absolute",
                                    right: "var(--space-4)",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--color-text-muted)",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {state?.error?.password && (
                            <span className="form-field-error" aria-live="polite">
                                {state.error.password[0]}
                            </span>
                        )}
                    </div>

                    {/* Submission Button */}
                    <button
                        type="submit"
                        className="auth-execution-btn"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <span className="btn-loading-state">
                                <span className="spinner-dot"></span> Establishing Secure Tunnel...
                            </span>
                        ) : (
                            "Authenticate Vault"
                        )}
                    </button>
                </form>

                {/* Footer Redirect links */}
                <div className="auth-footer-redirect">
                    <p>
                        New to the institution?{" "}
                        <Link href="/register" className="premium-link-accent">
                            Initiate Sovereign Profile
                        </Link>
                    </p>
                </div>

            </div>
        </main>
    );
}