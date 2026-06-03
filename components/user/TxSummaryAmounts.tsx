"use client";

import { PiggyBank, Wallet, CreditCard, TrendingUp } from "lucide-react";
import { useBalanceVisibility } from "@/lib/useBalanceVisibility";

function fmt(n: number, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

interface Props {
    savingsBalance: number;
    savingsCurrency?: string;
    checkingBalance: number;
    checkingCurrency?: string;
    loanBalance: number;
    investmentBalance: number;
    investmentCurrency?: string;
}

export function TxSummaryAmounts({
    savingsBalance, savingsCurrency = "GBP",
    checkingBalance, checkingCurrency = "GBP",
    loanBalance,
    investmentBalance, investmentCurrency = "GBP",
}: Props) {
    const { visible } = useBalanceVisibility();
    const mask = "***";
    const s = visible ? fmt(savingsBalance, savingsCurrency) : mask;
    const c = visible ? fmt(checkingBalance, checkingCurrency) : mask;
    const l = visible ? fmt(loanBalance) : mask;
    const i = visible ? fmt(investmentBalance, investmentCurrency) : mask;

    return (
        <div className="txpage__summary" style={{ alignItems: "center", gap: "var(--space-3)" }}>
            {/* Savings */}
            <div className="txpage__summary-item">
                <span className="txpage__summary-label" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <PiggyBank size={11} aria-hidden="true" />
                    Savings
                </span>
                <span className="txpage__summary-amount txpage__summary-amount--credit">
                    {s}
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
                    {c}
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
                    {l}
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
                    {i}
                </span>
            </div>
        </div>
    );
}
