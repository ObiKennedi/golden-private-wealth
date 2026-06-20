"use client";

import { Eye, EyeOff } from "lucide-react";
import { useBalanceVisibility } from "@/lib/useBalanceVisibility";

interface AccountData {
    balance: number;
    currency: string;
    accountNumber?: string;
}

interface BalanceCardProps {
    checking?: AccountData;
    savings?: AccountData;
    invest?: AccountData;
    credit?: AccountData;
}

function fmt(val: number, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency === "USD" ? "GBP" : currency,
        minimumFractionDigits: 2,
    }).format(val);
}

export default function BalanceCard({ checking, savings, invest, credit }: BalanceCardProps) {
    const { visible, toggle } = useBalanceVisibility();

    return (
        <section className="dash__balance-card" aria-label="Account balances">
            <button
                onClick={toggle}
                className="dash__balance-toggle"
                aria-label={visible ? "Hide balances" : "Show balances"}
            >
                {visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            <div className="dash__balance-primary">
                <span className="dash__balance-label">Checking Balance</span>
                <span className="dash__balance-amount">
                    {checking ? (visible ? fmt(checking.balance, checking.currency) : "********") : "—"}
                </span>
                {checking && (
                    <span className="dash__balance-acct">
                        •••• {checking.accountNumber!.slice(-4)}
                    </span>
                )}
            </div>

            <div className="dash__balance-secondary">
                {[
                    { label: "Savings", account: savings },
                    { label: "Investment", account: invest },
                    { label: "Credit", account: credit },
                ].map(({ label, account }) => (
                    <div key={label} className="dash__balance-sub">
                        <span className="dash__balance-sub-label">{label}</span>
                        <span className="dash__balance-sub-amount">
                            {account ? (visible ? fmt(account.balance, account.currency) : "****") : "—"}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
