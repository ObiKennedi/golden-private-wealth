"use client";

import React, { useActionState, useState, useCallback } from "react";
import Link from "next/link";
import { signUpAction } from "@/actions/auth";
import { SignUpSchema } from "@/lib/schemas";
import { z } from "zod";

type FieldErrors = Partial<Record<keyof z.infer<typeof SignUpSchema>, string>>;

export default function RegisterPage() {
    const [state, formAction, isPending] = useActionState(signUpAction, null);

    const [fields, setFields] = useState({
        fullName: "",
        email: "",
        password: "",
        ssn: "",
    });
    const [touched, setTouched] = useState<Partial<Record<keyof typeof fields, boolean>>>({});
    const [clientErrors, setClientErrors] = useState<FieldErrors>({});

    const validateField = useCallback(
        (name: keyof typeof fields, value: string) => {
            // Parse only that field's slice — pick pulls one key out of the schema
            const result = SignUpSchema.pick({ [name]: true } as any).safeParse({ [name]: value });
            setClientErrors((prev) => ({
                ...prev,
                [name]: result.success ? undefined : result.error.issues[0]?.message,
            }));
        },
        []
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Auto-format SSN as user types: insert dashes at positions 3 and 5
        let formatted = value;
        if (name === "ssn") {
            const digits = value.replace(/\D/g, "").slice(0, 9);
            if (digits.length <= 3) formatted = digits;
            else if (digits.length <= 5) formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
            else formatted = `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
        }

        setFields((prev) => ({ ...prev, [name]: formatted }));

        // Only live-validate if the field has already been touched
        if (touched[name as keyof typeof fields]) {
            validateField(name as keyof typeof fields, formatted);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target as { name: keyof typeof fields; value: string };
        setTouched((prev) => ({ ...prev, [name]: true }));
        validateField(name, value);
    };

    // Merge: server errors lose to client errors (client errors are fresher)
    const getError = (name: keyof typeof fields) =>
        clientErrors[name] ?? state?.error?.[name]?.[0];

    return (
        <main className="auth-page-wrapper">
            <div className="auth-card-container">
                <div className="auth-header-block">
                    <span className="auth-pretitle">Institutional Onboarding</span>
                    <h1 className="auth-title">Initiate Sovereign Profile</h1>
                    <p className="auth-subtitle">
                        Establish your credentials to begin private wealth allocation and custodial engineering.
                    </p>
                </div>

                <form action={formAction} className="auth-form-element">

                    {state?.globalError && (
                        <div className="auth-alert-banner alert-error" role="alert">
                            <span className="alert-icon">✦</span>
                            <p>{state.globalError}</p>
                        </div>
                    )}

                    <div className="form-input-wrapper">
                        <label htmlFor="fullName">Full Legal Name</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="e.g., Alexander Sterling"
                            value={fields.fullName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={isPending}
                            required
                            aria-invalid={!!getError("fullName")}
                            aria-describedby={getError("fullName") ? "fullName-error" : undefined}
                        />
                        {getError("fullName") && (
                            <span className="form-field-error" id="fullName-error" aria-live="polite">
                                {getError("fullName")}
                            </span>
                        )}
                    </div>

                    <div className="form-input-wrapper">
                        <label htmlFor="email">Private / Corporate Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="e.g., sterling@vault.com"
                            value={fields.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={isPending}
                            required
                            aria-invalid={!!getError("email")}
                            aria-describedby={getError("email") ? "email-error" : undefined}
                        />
                        {getError("email") && (
                            <span className="form-field-error" id="email-error" aria-live="polite">
                                {getError("email")}
                            </span>
                        )}
                    </div>

                    <div className="form-input-wrapper">
                        <label htmlFor="password">Security Password Profile</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="••••••••••••"
                            value={fields.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            disabled={isPending}
                            required
                            aria-invalid={!!getError("password")}
                            aria-describedby={getError("password") ? "password-error" : undefined}
                        />
                        {getError("password") && (
                            <span className="form-field-error" id="password-error" aria-live="polite">
                                {getError("password")}
                            </span>
                        )}
                    </div>

                    <div className="form-input-wrapper">
                        <label htmlFor="ssn">Social Security Number / Tax ID</label>
                        <input
                            type="text"
                            id="ssn"
                            name="ssn"
                            placeholder="XXX-XX-XXXX"
                            value={fields.ssn}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            maxLength={11}
                            disabled={isPending}
                            required
                            inputMode="numeric"
                            aria-invalid={!!getError("ssn")}
                            aria-describedby="ssn-hint ssn-error"
                        />
                        <span className="form-input-hint" id="ssn-hint">
                            Mandated for regulatory KYC &amp; asset clearing compliance.
                        </span>
                        {getError("ssn") && (
                            <span className="form-field-error" id="ssn-error" aria-live="polite">
                                {getError("ssn")}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="auth-execution-btn"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <span className="btn-loading-state">
                                <span className="spinner-dot" /> Provisioning Security Profile...
                            </span>
                        ) : (
                            "Initialize Application"
                        )}
                    </button>
                </form>

                <div className="auth-footer-redirect">
                    <p>
                        Already have an active credential profile?{" "}
                        <Link href="/login" className="premium-link-accent">
                            Authenticate Vault Access
                        </Link>
                    </p>
                </div>
            </div>
        </main>
    );
}