"use client";

import React, { useActionState, use, useState, useEffect } from "react";
import { verifyEmailAction, resendOtpAction } from "@/actions/auth";

type SearchParams = Promise<{ target?: string }>;

const RESEND_COOLDOWN = 60;

export default function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
    const resolvedParams = use(searchParams);
    const targetEmail = resolvedParams.target || "";

    const [state, formAction, isPending] = useActionState(verifyEmailAction, null);
    const [resendState, resendAction, isResending] = useActionState(resendOtpAction, null);

    const [cooldown, setCooldown] = useState(0);

    // Start cooldown after a resend attempt
    useEffect(() => {
        if (resendState?.success) {
            setCooldown(RESEND_COOLDOWN);
        }
    }, [resendState]);

    // Tick the countdown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const canResend = cooldown === 0 && !isResending;

    return (
        <main className="auth-page-wrapper">
            <div className="auth-card-container">

                <div className="auth-header-block">
                    <span className="auth-pretitle">Security Dispatch</span>
                    <h1 className="auth-title">Verify Your Email</h1>
                    <p className="auth-subtitle">
                        A secure 6-digit confirmation signature has been transmitted to{" "}
                        <strong className="email-highlight">{targetEmail}</strong>.
                    </p>
                </div>

                <form action={formAction} className="auth-form-element">
                    {state?.globalError && (
                        <div className="auth-alert-banner alert-error" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>{state.globalError}</p>
                        </div>
                    )}

                    <input type="hidden" name="email" value={targetEmail} />
                    <input type="hidden" name="purpose" value="EMAIL_VERIFICATION" />

                    <div className="form-input-wrapper">
                        <label htmlFor="code">Verification Code</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            placeholder="000000"
                            maxLength={6}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            disabled={isPending}
                            className="otp-character-input"
                            required
                        />
                        {state?.error?.code && (
                            <span className="form-field-error" aria-live="polite">
                                {state.error.code[0]}
                            </span>
                        )}
                    </div>

                    <button type="submit" className="auth-execution-btn" disabled={isPending}>
                        {isPending ? (
                            <span className="btn-loading-state">
                                <span className="spinner-dot" /> Confirming Signature...
                            </span>
                        ) : (
                            "Verify Profile"
                        )}
                    </button>
                </form>

                {/* Resend block — separate form so it doesn't interfere with verify state */}
                <div className="auth-resend-block">
                    {resendState?.success && cooldown > 0 && (
                        <div className="auth-alert-banner alert-success" role="status">
                            <span className="alert-icon">✦</span>
                            <p>A new code has been dispatched to {targetEmail}.</p>
                        </div>
                    )}

                    {resendState?.globalError && (
                        <div className="auth-alert-banner alert-error" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>{resendState.globalError}</p>
                        </div>
                    )}

                    <p className="auth-resend-label">Didn&apos;t receive the code?</p>

                    <form action={resendAction}>
                        <input type="hidden" name="email" value={targetEmail} />
                        <input type="hidden" name="purpose" value="EMAIL_VERIFICATION" />

                        <button
                            type="submit"
                            className="auth-resend-btn"
                            disabled={!canResend}
                            aria-disabled={!canResend}
                        >
                            {isResending ? (
                                <span className="btn-loading-state">
                                    <span className="spinner-dot" /> Dispatching...
                                </span>
                            ) : cooldown > 0 ? (
                                <>Resend available in <strong>{cooldown}s</strong></>
                            ) : (
                                "Resend Verification Code"
                            )}
                        </button>
                    </form>
                </div>

            </div>
        </main>
    );
}