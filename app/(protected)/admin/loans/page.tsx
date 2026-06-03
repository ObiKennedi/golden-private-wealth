import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    Landmark,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    CircleDot,
    BadgeCheck,
    Calendar,
    User,
} from "lucide-react";
import LoanActionButtons from "@/components/admin/LoanActionButtons";
import "@/styles/admin/loans.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

function fmt(val: { toFixed: (n: number) => string } | number, currency = "GBP") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency === "USD" ? "GBP" : currency,
        minimumFractionDigits: 2,
    }).format(n);
}

function fmtDate(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

const STATUS_META = {
    PENDING: { label: "Pending", cls: "status--pending", Icon: Clock },
    UNDER_REVIEW: { label: "Under Review", cls: "status--review", Icon: AlertCircle },
    APPROVED: { label: "Approved", cls: "status--approved", Icon: BadgeCheck },
    ACTIVE: { label: "Active", cls: "status--active", Icon: CircleDot },
    REJECTED: { label: "Rejected", cls: "status--rejected", Icon: XCircle },
    CLOSED: { label: "Closed", cls: "status--closed", Icon: CheckCircle },
};

export default async function AdminLoansPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
    } catch {
        redirect("/login");
    }

    const loans = await prisma.loan.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    fullName: true,
                    email: true,
                    accounts: {
                        where: { type: "CHECKING" },
                        select: { id: true, accountNumber: true, balance: true },
                    },
                },
            },
        },
    });

    const pending = loans.filter(l => ["PENDING", "UNDER_REVIEW"].includes(l.status));
    const active = loans.filter(l => l.status === "ACTIVE");
    const resolved = loans.filter(l => ["APPROVED", "REJECTED", "CLOSED"].includes(l.status));

    const totalExposure = active.reduce((s, l) => s + Number(l.principalAmount), 0);

    return (
        <div className="adminloans">

            {/* ── Header ── */}
            <header className="adminloans__header">
                <div>
                    <p className="adminloans__pretitle">Credit Management</p>
                    <h1 className="adminloans__title">Loan Applications</h1>
                </div>
                <div className="adminloans__summary">
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Awaiting Review</span>
                        <span className="adminloans__summary-amount adminloans__summary-amount--amber">
                            {pending.length}
                        </span>
                    </div>
                    <div className="adminloans__summary-divider" aria-hidden="true" />
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Active Loans</span>
                        <span className="adminloans__summary-amount">{active.length}</span>
                    </div>
                    <div className="adminloans__summary-divider" aria-hidden="true" />
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Total Exposure</span>
                        <span className="adminloans__summary-amount adminloans__summary-amount--red">
                            {fmt(totalExposure)}
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Pending ── */}
            {pending.length > 0 && (
                <section className="adminloans__section" aria-label="Pending applications">
                    <h2 className="adminloans__section-title">
                        Awaiting Action
                        <span className="adminloans__section-count">{pending.length}</span>
                    </h2>
                    <div className="adminloans__cards">
                        {pending.map(loan => {
                            const checking = loan.user.accounts[0];
                            const meta = STATUS_META[loan.status as keyof typeof STATUS_META];
                            const StatusIcon = meta.Icon;
                            return (
                                <div key={loan.id} className="adminloans__card adminloans__card--pending">
                                    <div className="adminloans__card-header">
                                        <div className="adminloans__card-user">
                                            <div className="adminloans__card-avatar">
                                                {loan.user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="adminloans__card-user-info">
                                                <span className="adminloans__card-name">{loan.user.fullName}</span>
                                                <span className="adminloans__card-email">{loan.user.email}</span>
                                            </div>
                                        </div>
                                        <span className={`adminloans__badge ${meta.cls}`}>
                                            <StatusIcon size={10} />
                                            {meta.label}
                                        </span>
                                    </div>

                                    <div className="adminloans__card-body">
                                        <div className="adminloans__card-amount">
                                            <span className="adminloans__card-amount-label">Requested Amount</span>
                                            <span className="adminloans__card-amount-value">
                                                {fmt(loan.principalAmount, loan.currency)}
                                            </span>
                                        </div>

                                        <div className="adminloans__card-details">
                                            <div className="adminloans__card-detail">
                                                <Landmark size={12} aria-hidden="true" />
                                                <span>{loan.type.replace(/_/g, " ")}</span>
                                            </div>
                                            <div className="adminloans__card-detail">
                                                <Calendar size={12} aria-hidden="true" />
                                                <span>{loan.termMonths} months</span>
                                            </div>
                                            <div className="adminloans__card-detail">
                                                <User size={12} aria-hidden="true" />
                                                <span>
                                                    Checking: {checking
                                                        ? `•••• ${checking.accountNumber.slice(-4)} — ${fmt(checking.balance)}`
                                                        : "No checking account"}
                                                </span>
                                            </div>
                                            <div className="adminloans__card-detail adminloans__card-detail--full">
                                                <span className="adminloans__card-purpose-label">Purpose:</span>
                                                <span>{loan.purpose}</span>
                                            </div>
                                            {loan.collateral && (
                                                <div className="adminloans__card-detail adminloans__card-detail--full">
                                                    <span className="adminloans__card-purpose-label">Collateral:</span>
                                                    <span>{loan.collateral}</span>
                                                </div>
                                            )}
                                            {loan.notes && (
                                                <div className="adminloans__card-detail adminloans__card-detail--full">
                                                    <span className="adminloans__card-purpose-label">Notes:</span>
                                                    <span>{loan.notes}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="adminloans__card-meta">
                                        <span>Applied {fmtDate(loan.createdAt)}</span>
                                        <span>Ref: {loan.referenceId.slice(0, 12).toUpperCase()}</span>
                                    </div>

                                    {/* Action buttons — client component */}
                                    {checking && (
                                        <LoanActionButtons
                                            loanId={loan.id}
                                            checkingAccountId={checking.id}
                                            amount={Number(loan.principalAmount)}
                                            currency={loan.currency}
                                            userName={loan.user.fullName}
                                        />
                                    )}

                                    {!checking && (
                                        <p className="adminloans__no-account">
                                            Cannot approve — user has no checking account.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ── Active ── */}
            {active.length > 0 && (
                <section className="adminloans__section" aria-label="Active loans">
                    <h2 className="adminloans__section-title">
                        Active Loans
                        <span className="adminloans__section-count adminloans__section-count--green">
                            {active.length}
                        </span>
                    </h2>
                    <ul className="adminloans__list" role="list">
                        {active.map(loan => (
                            <li key={loan.id} className="adminloans__item">
                                <div className="adminloans__item-icon">
                                    <Landmark size={15} aria-hidden="true" />
                                </div>
                                <div className="adminloans__item-info">
                                    <span className="adminloans__item-name">{loan.user.fullName}</span>
                                    <span className="adminloans__item-meta">
                                        {loan.type.replace(/_/g, " ")} ·{" "}
                                        {loan.termMonths}mo ·{" "}
                                        {Number(loan.interestRate).toFixed(2)}% p.a. ·{" "}
                                        Since {fmtDate(loan.createdAt)}
                                    </span>
                                </div>
                                <div className="adminloans__item-right">
                                    <span className="adminloans__item-amount">
                                        {fmt(loan.principalAmount, loan.currency)}
                                    </span>
                                    {loan.monthlyPayment && (
                                        <span className="adminloans__item-monthly">
                                            {fmt(loan.monthlyPayment, loan.currency)}/mo
                                        </span>
                                    )}
                                    <span className="adminloans__badge status--active">
                                        <CircleDot size={10} /> Active
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* ── Resolved ── */}
            {resolved.length > 0 && (
                <section className="adminloans__section" aria-label="Resolved loans">
                    <h2 className="adminloans__section-title">Resolved</h2>
                    <ul className="adminloans__list" role="list">
                        {resolved.map(loan => {
                            const meta = STATUS_META[loan.status as keyof typeof STATUS_META];
                            const StatusIcon = meta.Icon;
                            return (
                                <li key={loan.id} className="adminloans__item adminloans__item--muted">
                                    <div className="adminloans__item-icon adminloans__item-icon--muted">
                                        <Landmark size={15} aria-hidden="true" />
                                    </div>
                                    <div className="adminloans__item-info">
                                        <span className="adminloans__item-name">{loan.user.fullName}</span>
                                        <span className="adminloans__item-meta">
                                            {loan.type.replace(/_/g, " ")} ·{" "}
                                            {loan.termMonths}mo ·{" "}
                                            {fmtDate(loan.createdAt)}
                                        </span>
                                    </div>
                                    <div className="adminloans__item-right">
                                        <span className="adminloans__item-amount adminloans__item-amount--muted">
                                            {fmt(loan.principalAmount, loan.currency)}
                                        </span>
                                        <span className={`adminloans__badge ${meta.cls}`}>
                                            <StatusIcon size={10} /> {meta.label}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {loans.length === 0 && (
                <div className="adminloans__empty">
                    <Landmark size={32} aria-hidden="true" />
                    <p>No loan applications on record.</p>
                </div>
            )}

        </div>
    );
}