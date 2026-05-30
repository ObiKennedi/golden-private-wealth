"use client";

import { useActionState, use } from "react";
import { resetPasswordAction } from "@/actions/auth";

type SearchParams = Promise<{ target?: string }>;

export default function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
    const resolvedParams = use(searchParams);
    const targetEmail = resolvedParams.target || "";
    const [state, formAction, isPending] = useActionState(resetPasswordAction, null);

    return (
        <main className="auth-page-wrapper">
            <div className="auth-card-container">

                <div className="auth-header-block">
                    <span className="auth-pretitle">Credential Override</span>
                    <h1 className="auth-title">Establish New Passphrase</h1>
                    <p className="auth-subtitle">
                        Provide the recovery token sent to your address alongside a revised security parameter sequence.
                    </p>
                </div>

                <form action={formAction} className="auth-form-element">
                    {state?.globalError && (
                        <div className="auth-alert-banner alert-error" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>{state.globalError}</p>
                        </div>
                    )}

                    {/* Implicit parameter bindings for state mapping verification */}
                    <input type="hidden" name="email" value={targetEmail} />

                    {/* Secure Code Input */}
                    <div className="form-input-wrapper">
                        <label htmlFor="code">Recovery Token (6-Digit OTP)</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            placeholder="000000"
                            maxLength={6}
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

                    {/* New Password Input */}
                    <div className="form-input-wrapper">
                        <label htmlFor="newPassword">New Security Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            placeholder="••••••••••••"
                            disabled={isPending}
                            required
                        />
                        {state?.error?.newPassword && (
                            <span className="form-field-error" aria-live="polite">
                                {state.error.newPassword[0]}
                            </span>
                        )}
                    </div>

                    <button type="submit" className="auth-execution-btn" disabled={isPending}>
                        {isPending ? "Rewriting Account Credentials..." : "Commit New Password"}
                    </button>
                </form>

            </div>
        </main>
    );
}