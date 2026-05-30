"use client";

import { useActionState } from "react";
import { approveLoanAction, rejectLoanAction } from "@/actions/admin/loans";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
    loanId: string;
    checkingAccountId: string;
    amount: number;
    currency: string;
    userName: string;
}

export default function LoanActionButtons({
    loanId,
    checkingAccountId,
    amount,
    currency,
    userName,
}: Props) {
    const [approveState, approveAction, approvePending] = useActionState(approveLoanAction, null);
    const [rejectState, rejectAction, rejectPending] = useActionState(rejectLoanAction, null);

    const isPending = approvePending || rejectPending;

    if (approveState?.success) {
        return (
            <div className="loan-actions__result loan-actions__result--success">
                <CheckCircle size={14} />
                Loan approved and funds disbursed to {userName}&apos;s checking account.
            </div>
        );
    }

    if (rejectState?.success) {
        return (
            <div className="loan-actions__result loan-actions__result--rejected">
                <XCircle size={14} />
                Application rejected.
            </div>
        );
    }

    return (
        <div className="loan-actions">
            {(approveState?.globalError || rejectState?.globalError) && (
                <p className="loan-actions__error">
                    {approveState?.globalError ?? rejectState?.globalError}
                </p>
            )}

            {/* Approve form */}
            <form action={approveAction} className="loan-actions__approve-form">
                <input type="hidden" name="loanId" value={loanId} />
                <input type="hidden" name="checkingAccountId" value={checkingAccountId} />
                <input type="hidden" name="amount" value={amount} />
                <input type="hidden" name="currency" value={currency} />

                <div className="loan-actions__rate-field">
                    <label htmlFor={`rate-${loanId}`}>Interest Rate (% p.a.)</label>
                    <input
                        type="number"
                        id={`rate-${loanId}`}
                        name="interestRate"
                        placeholder="e.g. 7.50"
                        min="0"
                        max="100"
                        step="0.01"
                        required
                        disabled={isPending}
                    />
                    {approveState?.error?.interestRate && (
                        <span className="loan-actions__field-error">
                            {approveState.error.interestRate[0]}
                        </span>
                    )}
                </div>

                <div className="loan-actions__buttons">
                    <button
                        type="submit"
                        className="loan-actions__btn loan-actions__btn--approve"
                        disabled={isPending}
                    >
                        <CheckCircle size={14} aria-hidden="true" />
                        {approvePending ? "Processing..." : "Approve & Disburse"}
                    </button>

                    {/* Reject button lives inside approve form for layout but submits its own form */}
                </div>
            </form>

            {/* Reject form */}
            <form action={rejectAction}>
                <input type="hidden" name="loanId" value={loanId} />
                <button
                    type="submit"
                    className="loan-actions__btn loan-actions__btn--reject"
                    disabled={isPending}
                >
                    <XCircle size={14} aria-hidden="true" />
                    {rejectPending ? "Rejecting..." : "Reject"}
                </button>
            </form>
        </div>
    );
}