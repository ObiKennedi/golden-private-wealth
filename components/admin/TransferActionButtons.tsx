"use client";

import { useActionState } from "react";
import {
    approveTransferAction,
    rejectTransferAction,
    reverseTransferAction,
} from "@/actions/admin/transfers";
import { CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface Props {
    transferId: string;
    checkingAccountId: string;
    amount: number;
    userName: string;
    /** If true, show Reverse instead of Approve/Reject */
    isCompletedInternal?: boolean;
}

export default function TransferActionButtons({
    transferId,
    checkingAccountId,
    amount,
    userName,
    isCompletedInternal = false,
}: Props) {
    const [approveState, approveAction, approvePending] = useActionState(approveTransferAction, null);
    const [rejectState, rejectAction, rejectPending] = useActionState(rejectTransferAction, null);
    const [reverseState, reverseAction, reversePending] = useActionState(reverseTransferAction, null);

    const isPending = approvePending || rejectPending || reversePending;

    // ── Completed internal — only show Reverse ─────────────────
    if (isCompletedInternal) {
        if (reverseState?.success) {
            return (
                <div className="loan-actions__result loan-actions__result--rejected">
                    <RotateCcw size={14} />
                    Transfer reversed. Funds have been returned to {userName}&apos;s account.
                </div>
            );
        }

        return (
            <div className="loan-actions">
                {reverseState?.globalError && (
                    <p className="loan-actions__error">{reverseState.globalError}</p>
                )}
                <div className="loan-actions__buttons">
                    <form action={reverseAction}>
                        <input type="hidden" name="transferId" value={transferId} />
                        <button
                            type="submit"
                            className="loan-actions__btn loan-actions__btn--reject"
                            disabled={isPending}
                        >
                            <RotateCcw size={14} aria-hidden="true" />
                            {reversePending ? "Reversing…" : "Reverse Transfer"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // ── Pending external — Approve / Reject ────────────────────
    if (approveState?.success) {
        return (
            <div className="loan-actions__result loan-actions__result--success">
                <CheckCircle size={14} />
                Transfer approved and funds deducted from {userName}&apos;s account.
            </div>
        );
    }

    if (rejectState?.success) {
        return (
            <div className="loan-actions__result loan-actions__result--rejected">
                <XCircle size={14} />
                Transfer rejected.
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

            <div className="loan-actions__buttons">
                {/* Approve form */}
                <form action={approveAction} className="loan-actions__approve-form">
                    <input type="hidden" name="transferId" value={transferId} />
                    <button
                        type="submit"
                        className="loan-actions__btn loan-actions__btn--approve"
                        disabled={isPending}
                    >
                        <CheckCircle size={14} aria-hidden="true" />
                        {approvePending ? "Processing..." : "Approve & Deduct"}
                    </button>
                </form>

                {/* Reject form */}
                <form action={rejectAction}>
                    <input type="hidden" name="transferId" value={transferId} />
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
        </div>
    );
}
