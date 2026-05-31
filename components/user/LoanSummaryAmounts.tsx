"use client";

import { Eye, EyeOff } from "lucide-react";
import { useBalanceVisibility } from "@/lib/useBalanceVisibility";

interface Props {
    totalOwed: string;
    activeCount: number;
    pendingCount: number;
}

export function LoanSummaryAmounts({ totalOwed, activeCount, pendingCount }: Props) {
    const { visible, toggle } = useBalanceVisibility();

    return (
        <div className="loanspage__summary" style={{ alignItems: "center" }}>
            <div className="loanspage__summary-item">
                <span className="loanspage__summary-label">Active Balance</span>
                <span className="loanspage__summary-amount">
                    {visible ? totalOwed : "********"}
                </span>
            </div>
            <div className="loanspage__summary-divider" aria-hidden="true" />
            <div className="loanspage__summary-item">
                <span className="loanspage__summary-label">Active Loans</span>
                <span className="loanspage__summary-amount">{activeCount}</span>
            </div>
            <div className="loanspage__summary-divider" aria-hidden="true" />
            <div className="loanspage__summary-item">
                <span className="loanspage__summary-label">In Review</span>
                <span className="loanspage__summary-amount">{pendingCount}</span>
            </div>
        </div>
    );
}
