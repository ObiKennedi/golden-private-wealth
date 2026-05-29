"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth";

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(forgotPasswordAction, null);

    return (
        <main className="auth-page-wrapper">
            <div className="auth-card-container">

                <div className="auth-header-block">
                    <span className="auth-pretitle">Account Recovery</span>
                    <h1 className="auth-title">Reset Security Profile</h1>
                    <p className="auth-subtitle">
                        Provide your registered email to receive a recovery token.
                    </p>
                </div>

                <form action={formAction} className="auth-form-element">

                    {state?.globalError && (
                        <div className="auth-alert-banner alert-error" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>{state.globalError}</p>
                        </div>
                    )}

                    {/* Conditional layout check matching server recovery returns */}
                    {state?.messageDispatch && !state?.globalError && (
                        <div className="auth-alert-banner alert-success" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>If the configuration maps an active profile, an operational token has been sent.</p>
                        </div>
                    )}

                    <div className="form-input-wrapper">
                        <label htmlFor="email">Registered Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="e.g., alexander@golden.bank"
                            disabled={isPending}
                            required
                        />
                        {state?.error?.email && (
                            <span className="form-field-error" aria-live="polite">
                                {state.error.email[0]}
                            </span>
                        )}
                    </div>

                    <button type="submit" className="auth-execution-btn" disabled={isPending}>
                        {isPending ? "Generating Token..." : "Request Recovery Token"}
                    </button>
                </form>

                <div className="auth-footer-redirect">
                    <p>
                        Remembered your access keys?{" "}
                        <Link href="/login" className="premium-link-accent">
                            Secure Sign In
                        </Link>
                    </p>
                </div>

            </div>
        </main>
    );
}