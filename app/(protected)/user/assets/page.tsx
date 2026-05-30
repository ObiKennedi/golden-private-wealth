import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    Wallet,
    PiggyBank,
    TrendingUp,
    Landmark,
    CreditCard,
    CircleDot,
    Clock,
    BadgeCheck,
    XCircle,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import "@/styles/user/assets.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

function fmt(val: { toFixed: (n: number) => string } | number, currency = "USD") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

function fmtDate(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

const ACCOUNT_META = {
    CHECKING: { label: "Checking", Icon: Wallet, cls: "acct--checking" },
    SAVINGS: { label: "Savings", Icon: PiggyBank, cls: "acct--savings" },
    INVESTMENT: { label: "Investment", Icon: TrendingUp, cls: "acct--investment" },
    CREDIT: { label: "Credit", Icon: CreditCard, cls: "acct--credit" },
};

const LOAN_STATUS_META = {
    PENDING: { label: "Pending", cls: "lstatus--pending", Icon: Clock },
    UNDER_REVIEW: { label: "Under Review", cls: "lstatus--review", Icon: AlertCircle },
    APPROVED: { label: "Approved", cls: "lstatus--approved", Icon: BadgeCheck },
    ACTIVE: { label: "Active", cls: "lstatus--active", Icon: CircleDot },
    REJECTED: { label: "Rejected", cls: "lstatus--rejected", Icon: XCircle },
    CLOSED: { label: "Closed", cls: "lstatus--closed", Icon: CheckCircle },
};

export default async function AssetsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    let userId: string;
    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        userId = payload.userId as string;
    } catch {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            accounts: true,
            loans: {
                where: { status: { in: ["ACTIVE", "APPROVED", "PENDING", "UNDER_REVIEW"] } },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!user) redirect("/login");

    const totalBalance = user.accounts.reduce((s, a) => s + Number(a.balance), 0);
    const totalLoanExposure = user.loans
        .filter(l => ["ACTIVE", "APPROVED"].includes(l.status))
        .reduce((s, l) => s + Number(l.principalAmount), 0);
    const netWorth = totalBalance - totalLoanExposure;

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
                        {netWorth >= 0 ? "" : "−"}{fmt(Math.abs(netWorth))}
                    </span>
                </div>
            </header>

            {/* ── Summary Row ── */}
            <div className="assetspage__summary-row">
                <div className="assetspage__summary-card">
                    <span className="assetspage__summary-label">Total Holdings</span>
                    <span className="assetspage__summary-amount assetspage__summary-amount--gold">
                        {fmt(totalBalance)}
                    </span>
                </div>
                <div className="assetspage__summary-card">
                    <span className="assetspage__summary-label">Loan Exposure</span>
                    <span className="assetspage__summary-amount assetspage__summary-amount--red">
                        {fmt(totalLoanExposure)}
                    </span>
                </div>
                <div className="assetspage__summary-card">
                    <span className="assetspage__summary-label">Accounts</span>
                    <span className="assetspage__summary-amount">
                        {user.accounts.length}
                    </span>
                </div>
                <div className="assetspage__summary-card">
                    <span className="assetspage__summary-label">Active Loans</span>
                    <span className="assetspage__summary-amount">
                        {user.loans.filter(l => l.status === "ACTIVE").length}
                    </span>
                </div>
            </div>

            {/* ── Accounts ── */}
            <section className="assetspage__section" aria-label="Accounts">
                <h2 className="assetspage__section-title">Accounts</h2>

                {user.accounts.length === 0 ? (
                    <div className="assetspage__empty">
                        <Wallet size={28} aria-hidden="true" />
                        <p>No accounts on record.</p>
                    </div>
                ) : (
                    <div className="assetspage__accounts">
                        {user.accounts.map(acct => {
                            const meta = ACCOUNT_META[acct.type] ?? ACCOUNT_META.CHECKING;
                            const Icon = meta.Icon;
                            return (
                                <div key={acct.id} className={`assetspage__acct-card ${meta.cls}`}>
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
                                            {fmt(acct.balance, acct.currency)}
                                        </span>
                                        <span className="assetspage__acct-currency">{acct.currency}</span>
                                    </div>
                                    <span className="assetspage__acct-since">
                                        Since {fmtDate(acct.createdAt)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Loans ── */}
            <section className="assetspage__section" aria-label="Active loans">
                <h2 className="assetspage__section-title">Outstanding Loans</h2>

                {user.loans.length === 0 ? (
                    <div className="assetspage__empty">
                        <Landmark size={28} aria-hidden="true" />
                        <p>No outstanding loans.</p>
                    </div>
                ) : (
                    <ul className="assetspage__loan-list" role="list">
                        {user.loans.map(loan => {
                            const meta = LOAN_STATUS_META[loan.status as keyof typeof LOAN_STATUS_META]
                                ?? LOAN_STATUS_META.PENDING;
                            const StatusIcon = meta.Icon;
                            return (
                                <li key={loan.id} className="assetspage__loan-item">
                                    <div className="assetspage__loan-icon">
                                        <Landmark size={16} aria-hidden="true" />
                                    </div>
                                    <div className="assetspage__loan-info">
                                        <span className="assetspage__loan-type">
                                            {loan.type.replace(/_/g, " ")} Loan
                                        </span>
                                        <span className="assetspage__loan-purpose">{loan.purpose}</span>
                                        <span className="assetspage__loan-meta">
                                            {loan.termMonths} months
                                            &nbsp;·&nbsp;
                                            {Number(loan.interestRate).toFixed(2)}% p.a.
                                            &nbsp;·&nbsp;
                                            Applied {fmtDate(loan.createdAt)}
                                        </span>
                                    </div>
                                    <div className="assetspage__loan-right">
                                        <span className="assetspage__loan-amount">
                                            {fmt(loan.principalAmount, loan.currency)}
                                        </span>
                                        {loan.monthlyPayment && (
                                            <span className="assetspage__loan-monthly">
                                                {fmt(loan.monthlyPayment, loan.currency)}/mo
                                            </span>
                                        )}
                                        <span className={`assetspage__loan-badge ${meta.cls}`}>
                                            <StatusIcon size={10} aria-hidden="true" />
                                            {meta.label}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

        </div>
    );
}