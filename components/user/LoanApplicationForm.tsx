"use client";

import { useActionState } from "react";
import { applyForLoanAction } from "@/actions/loans";
import { ChevronDown } from "lucide-react";

const LOAN_TYPES = [
    { value: "PERSONAL", label: "Personal Loan" },
    { value: "MORTGAGE", label: "Mortgage" },
    { value: "AUTO", label: "Auto Loan" },
    { value: "BUSINESS", label: "Business Loan" },
    { value: "INVESTMENT", label: "Investment Loan" },
    { value: "LINE_OF_CREDIT", label: "Line of Credit" },
];

const TERM_OPTIONS = [6, 12, 24, 36, 48, 60, 84, 120, 180, 240, 360];

export default function LoanApplicationForm() {
    const [state, formAction, isPending] = useActionState(applyForLoanAction, null);

    return (
        <div className="loan-form">
            {state?.success && (
                <div className="loan-form__alert loan-form__alert--success" role="alert">
                    <p>Your application has been submitted. Our team will review it shortly.</p>
                </div>
            )}

            {state?.globalError && (
                <div className="loan-form__alert loan-form__alert--error" role="alert">
                    <p>{state.globalError}</p>
                </div>
            )}

            <form action={formAction} className="loan-form__body">
                <div className="loan-form__grid">

                    {/* Loan Type */}
                    <div className="loan-form__field loan-form__field--full">
                        <label htmlFor="type">Loan Type</label>
                        <div className="loan-form__select-wrap">
                            <select id="type" name="type" disabled={isPending} defaultValue="">
                                <option value="" disabled>Select loan type</option>
                                {LOAN_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="loan-form__select-icon" size={14} aria-hidden="true" />
                        </div>
                        {state?.error?.type && (
                            <span className="loan-form__field-error">{state.error.type[0]}</span>
                        )}
                    </div>

                    {/* Principal Amount */}
                    <div className="loan-form__field">
                        <label htmlFor="principalAmount">Loan Amount (USD)</label>
                        <input
                            type="number"
                            id="principalAmount"
                            name="principalAmount"
                            placeholder="e.g. 50000"
                            min="1000"
                            step="500"
                            disabled={isPending}
                        />
                        {state?.error?.principalAmount && (
                            <span className="loan-form__field-error">{state.error.principalAmount[0]}</span>
                        )}
                    </div>

                    {/* Term */}
                    <div className="loan-form__field">
                        <label htmlFor="termMonths">Repayment Term</label>
                        <div className="loan-form__select-wrap">
                            <select id="termMonths" name="termMonths" disabled={isPending} defaultValue="">
                                <option value="" disabled>Select term</option>
                                {TERM_OPTIONS.map(m => (
                                    <option key={m} value={m}>
                                        {m >= 12 ? `${m / 12} year${m / 12 > 1 ? "s" : ""}` : `${m} months`}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="loan-form__select-icon" size={14} aria-hidden="true" />
                        </div>
                        {state?.error?.termMonths && (
                            <span className="loan-form__field-error">{state.error.termMonths[0]}</span>
                        )}
                    </div>

                    {/* Purpose */}
                    <div className="loan-form__field loan-form__field--full">
                        <label htmlFor="purpose">Purpose of Loan</label>
                        <input
                            type="text"
                            id="purpose"
                            name="purpose"
                            placeholder="e.g. Home renovation, business expansion..."
                            disabled={isPending}
                        />
                        {state?.error?.purpose && (
                            <span className="loan-form__field-error">{state.error.purpose[0]}</span>
                        )}
                    </div>

                    {/* Collateral */}
                    <div className="loan-form__field loan-form__field--full">
                        <label htmlFor="collateral">
                            Collateral <span className="loan-form__optional">(optional)</span>
                        </label>
                        <input
                            type="text"
                            id="collateral"
                            name="collateral"
                            placeholder="e.g. Property at 12 Oak Street, vehicle registration..."
                            disabled={isPending}
                        />
                    </div>

                    {/* Notes */}
                    <div className="loan-form__field loan-form__field--full">
                        <label htmlFor="notes">
                            Additional Notes <span className="loan-form__optional">(optional)</span>
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            placeholder="Any additional context for your application..."
                            disabled={isPending}
                        />
                    </div>

                </div>

                <div className="loan-form__footer">
                    <p className="loan-form__disclaimer">
                        Applications are subject to credit assessment. Interest rates are assigned upon approval.
                    </p>
                    <button
                        type="submit"
                        className="loan-form__submit"
                        disabled={isPending}
                    >
                        {isPending ? "Submitting Application..." : "Submit Application"}
                    </button>
                </div>
            </form>
        </div>
    );
}