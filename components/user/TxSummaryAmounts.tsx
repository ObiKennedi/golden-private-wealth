"use client";

import { PiggyBank, Wallet, CreditCard, TrendingUp } from "lucide-react";

interface Props {
    savingsBalance: string;
    checkingBalance: string;
    loanBalance: string;
    investmentBalance: string;
}

export function TxSummaryAmounts({ savingsBalance, checkingBalance, loanBalance, investmentBalance }: Props) {

    return (
        <div className="txpage__summary" style={{ alignItems: "center", gap: "var(--space-3)" }}>
            {/* Savings */}
            <div className="txpage__summary-item">
                <span className="txpage__summary-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <PiggyBank size={11} aria-hidden="true" />
                    Savings
                </span>
                <span className="txpage__summary-amount txpage__summary-amount--credit">
                    { savingsBalance }
                </span>
            </div>

            <div className="txpage__summary-divider" aria-hidden="true" />

            {/* Checking */}
            <div className="txpage__summary-item">
                <span className="txpage__summary-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Wallet size={11} aria-hidden="true" />
                    Checking
                </span>
                <span className="txpage__summary-amount">
                    { checkingBalance }
                </span>
            </div>

            <div className="txpage__summary-divider" aria-hidden="true" />

            {/* Loan */}
            <div className="txpage__summary-item">
                <span className="txpage__summary-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <CreditCard size={11} aria-hidden="true" />
                    Loan
                </span>
                <span className="txpage__summary-amount txpage__summary-amount--debit">
                    { loanBalance }
                </span>
            </div>

            <div className="txpage__summary-divider" aria-hidden="true" />

            {/* Investment */}
            <div className="txpage__summary-item">
                <span className="txpage__summary-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <TrendingUp size={11} aria-hidden="true" />
                    Investment
                </span>
                <span className="txpage__summary-amount" style={{ color: "var(--color-gold-400)" }}>
                    { investmentBalance }
                </span>
            </div>
        </div>
    );
}
