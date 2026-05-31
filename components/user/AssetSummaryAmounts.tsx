"use client";

import { Eye, EyeOff } from "lucide-react";
import { useBalanceVisibility } from "@/lib/useBalanceVisibility";

interface Props {
    totalBalance: string;
    totalLoanExposure: string;
    accountCount: number;
    activeLoanCount: number;
}

export function AssetSummaryAmounts({ totalBalance, totalLoanExposure, accountCount, activeLoanCount }: Props) {
    const { visible, toggle } = useBalanceVisibility();

    return (
        <div className="assetspage__summary-row">
            <div className="assetspage__summary-card">
                <span className="assetspage__summary-label">Total Holdings</span>
                <span className="assetspage__summary-amount assetspage__summary-amount--gold">
                    {visible ? totalBalance : "********"}
                </span>
            </div>
            <div className="assetspage__summary-card">
                <span className="assetspage__summary-label">Loan Exposure</span>
                <span className="assetspage__summary-amount assetspage__summary-amount--red">
                    {visible ? totalLoanExposure : "********"}
                </span>
            </div>
            <div className="assetspage__summary-card">
                <span className="assetspage__summary-label">Accounts</span>
                <span className="assetspage__summary-amount">{accountCount}</span>
            </div>
            <div className="assetspage__summary-card">
                <span className="assetspage__summary-label">Active Loans</span>
                <span className="assetspage__summary-amount">{activeLoanCount}</span>
            </div>
        </div>
    );
}
