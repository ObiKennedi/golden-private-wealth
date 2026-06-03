"use client";

import {
    Wallet,
    PiggyBank,
    TrendingUp,
    CreditCard,
    Landmark
} from "lucide-react";
import { useBalanceVisibility } from "@/lib/useBalanceVisibility";
import { AssetSummaryAmounts } from "@/components/user/AssetSummaryAmounts";
import { AssetLoansList } from "@/components/user/AssetLoansList";
import "@/styles/user/assets.scss";

function fmt(val: { toFixed: (n: number) => string } | number, currency = "GBP") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

function fmtDate(date: Date | string) {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(d);
}

const ACCOUNT_META = {
    CHECKING: { label: "Checking", Icon: Wallet, cls: "acct--checking" },
    SAVINGS: { label: "Savings", Icon: PiggyBank, cls: "acct--savings" },
    INVESTMENT: { label: "Investment", Icon: TrendingUp, cls: "acct--investment" },
    CREDIT: { label: "Credit", Icon: CreditCard, cls: "acct--credit" },
};

interface Account {
    id: string;
    accountNumber: string;
    type: string;
    balance: any;
    currency: string;
    createdAt: any;
}

interface Loan {
    id: string;
    referenceId: string;
    type: string;
    status: string;
    principalAmount: any;
    currency: string;
    interestRate: any;
    termMonths: number;
    monthlyPayment: any;
    purpose: string;
    collateral: string | null;
    notes: string | null;
    createdAt: any;
}

interface AssetsClientProps {
    accounts: Account[];
    loans: Loan[];
    netWorth: number;
    totalBalance: number;
    totalLoanExposure: number;
}

import Link from "next/link";

export function AssetsClient({
    accounts,
    loans,
    netWorth,
    totalBalance,
    totalLoanExposure,
}: AssetsClientProps) {
    const { visible } = useBalanceVisibility();

    return (
        <div className="assetspage">

            {/* ── Header ── */}
            <header className="assetspage__header">
                <div>
                    <p className="assetspage__pretitle">Financial Overview</p>
                    <h1 className="assetspage__title">Assets</h1>
                </div>
                <div className="assetspage__networth">
                    <span className="assetspage__networth-label">Estimated Net Position</span>
                    <span className={`assetspage__networth-amount ${netWorth >= 0 ? "pos" : "neg"}`}>
                        {visible ? (
                            <>
                                {netWorth >= 0 ? "" : "−"}{fmt(Math.abs(netWorth))}
                            </>
                        ) : (
                            "********"
                        )}
                    </span>
                </div>
            </header>

            {/* ── Summary Row ── */}
            <AssetSummaryAmounts
                totalBalance={fmt(totalBalance)}
                totalLoanExposure={fmt(totalLoanExposure)}
                accountCount={accounts.length}
                activeLoanCount={loans.filter(l => l.status === "ACTIVE").length}
            />

            {/* ── Accounts ── */}
            <section className="assetspage__section" aria-label="Accounts">
                <h2 className="assetspage__section-title">Accounts</h2>

                {accounts.length === 0 ? (
                    <div className="assetspage__empty">
                        <Wallet size={28} aria-hidden="true" />
                        <p>No accounts on record.</p>
                    </div>
                ) : (
                    <div className="assetspage__accounts">
                        {accounts.map(acct => {
                            const meta = (ACCOUNT_META as any)[acct.type] ?? ACCOUNT_META.CHECKING;
                            const Icon = meta.Icon;
                            const isChecking = acct.type === "CHECKING";
                            const isSavings = acct.type === "SAVINGS";

                            const cardContent = (
                                <>
                                    <div className="assetspage__acct-top">
                                        <div className="assetspage__acct-icon">
                                            <Icon size={18} aria-hidden="true" />
                                        </div>
                                        <div className="assetspage__acct-info">
                                            <span className="assetspage__acct-type">{meta.label}</span>
                                            <span className="assetspage__acct-number">
                                                •••• {acct.accountNumber.slice(-4)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="assetspage__acct-bottom">
                                        <span className="assetspage__acct-balance-label">Balance</span>
                                        <span className="assetspage__acct-balance">
                                            {visible ? fmt(acct.balance, acct.currency) : "****"}
                                        </span>
                                        <span className="assetspage__acct-currency">{acct.currency}</span>
                                    </div>
                                    <span className="assetspage__acct-since">
                                        Since {fmtDate(acct.createdAt)}
                                    </span>
                                </>
                            );

                            if (isChecking) {
                                return (
                                    <Link
                                        key={acct.id}
                                        href="/user"
                                        className={`assetspage__acct-card ${meta.cls} assetspage__acct-card--link`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        {cardContent}
                                    </Link>
                                );
                            }

                            if (isSavings) {
                                return (
                                    <Link
                                        key={acct.id}
                                        href="/user/savings"
                                        className={`assetspage__acct-card ${meta.cls} assetspage__acct-card--link`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        {cardContent}
                                    </Link>
                                );
                            }

                            return (
                                <div key={acct.id} className={`assetspage__acct-card ${meta.cls}`}>
                                    {cardContent}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Loans ── */}
            <section className="assetspage__section" aria-label="Active loans">
                <h2 className="assetspage__section-title">Outstanding Loans</h2>

                {loans.length === 0 ? (
                    <div className="assetspage__empty">
                        <Landmark size={28} aria-hidden="true" />
                        <p>No outstanding loans.</p>
                    </div>
                ) : (
                    <AssetLoansList loans={loans} />
                )}
            </section>

        </div>
    );
}
