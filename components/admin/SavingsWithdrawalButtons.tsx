"use client";

import { useActionState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import {
    approveSavingsWithdrawalAction,
    rejectSavingsWithdrawalAction,
} from "@/actions/admin/transfers";

interface Props {
    transferId: string;
    lockId: string;
    userName: string;
    totalPayout: number;
}

function fmt(val: number) {
    return new Intl.NumberFormat("en-UK", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
    }).format(val);
}

export default function SavingsWithdrawalButtons({
    transferId,
    lockId,
    userName,
    totalPayout,
}: Props) {
    const [approveState, approveAction, approvePending] = useActionState(
        approveSavingsWithdrawalAction,
        null
    );
    const [rejectState, rejectAction, rejectPending] = useActionState(
        rejectSavingsWithdrawalAction,
        null
    );

    const isPending = approvePending || rejectPending;

    if (approveState?.success) {
        return (
            <div className="loan-actions__result loan-actions__result--success">
                <CheckCircle size={14} />
                Approved — {fmt(totalPayout)} credited to {userName}&apos;s checking account.
            </div>
        );
    }

    if (rejectState?.success) {
        return (
            <div className="loan-actions__result loan-actions__result--rejected">
                <XCircle size={14} />
                Rejected — lock reset. User may re-request when ready.
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
                {/* Approve */}
                <form action={approveAction}>
                    <input type="hidden" name="transferId" value={transferId} />
                    <input type="hidden" name="lockId" value={lockId} />
                    <button
                        type="submit"
                        className="loan-actions__btn loan-actions__btn--approve"
                        disabled={isPending}
                    >
                        <CheckCircle size={14} aria-hidden="true" />
                        {approvePending ? "Processing…" : `Approve & Pay ${fmt(totalPayout)}`}
                    </button>
                </form>

                {/* Reject */}
                <form action={rejectAction}>
                    <input type="hidden" name="transferId" value={transferId} />
                    <input type="hidden" name="lockId" value={lockId} />
                    <button
                        type="submit"
                        className="loan-actions__btn loan-actions__btn--reject"
                        disabled={isPending}
                    >
                        <XCircle size={14} aria-hidden="true" />
                        {rejectPending ? "Rejecting…" : "Reject"}
                    </button>
                </form>
            </div>
        </div>
    );
}
