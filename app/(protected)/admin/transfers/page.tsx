import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    Send,
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    PiggyBank,
    TrendingUp,
    Lock,
} from "lucide-react";
import TransferActionButtons from "@/components/admin/TransferActionButtons";
import SavingsWithdrawalButtons from "@/components/admin/SavingsWithdrawalButtons";
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
    COMPLETED: { label: "Completed", cls: "status--approved", Icon: CheckCircle },
    FAILED: { label: "Failed", cls: "status--rejected", Icon: XCircle },
    REJECTED: { label: "Rejected", cls: "status--rejected", Icon: XCircle },
};

export default async function AdminTransfersPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
    } catch {
        redirect("/login");
    }

    const allTransfers = await prisma.transfer.findMany({
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

    // Split savings withdrawals from regular wire transfers
    const savingsTransfers = allTransfers.filter(t => t.note?.startsWith("SAVINGS_WITHDRAWAL:"));
    const wireTransfers = allTransfers.filter(t => !t.note?.startsWith("SAVINGS_WITHDRAWAL:"));

    // Fetch savings locks for pending withdrawal transfers
    const savingsLockIds = savingsTransfers
        .map(t => t.note!.replace("SAVINGS_WITHDRAWAL:", ""))
        .filter(Boolean);

    const savingsLocks = savingsLockIds.length > 0
        ? await prisma.savingsLock.findMany({
            where: { id: { in: savingsLockIds } },
            include: { user: { select: { fullName: true, email: true } } },
            })
        : [];

    const lockMap = new Map(savingsLocks.map(l => [l.id, l]));

    const pending = wireTransfers.filter(t => t.status === "PENDING");
    const resolved = wireTransfers.filter(t => ["COMPLETED", "FAILED", "REJECTED"].includes(t.status));
    const pendingSavings = savingsTransfers.filter(t => t.status === "PENDING");
    const resolvedSavings = savingsTransfers.filter(t => ["COMPLETED", "REJECTED"].includes(t.status));
    const totalPendingVolume = pending.reduce((s, t) => s + Number(t.amount), 0);

    return (
        <div className="adminloans">

            {/* ── Header ── */}
            <header className="adminloans__header">
                <div>
                    <p className="adminloans__pretitle">Payment Operations</p>
                    <h1 className="adminloans__title">Transfers & Withdrawals</h1>
                </div>
                <div className="adminloans__summary">
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Wire Transfers Pending</span>
                        <span className="adminloans__summary-amount adminloans__summary-amount--amber">
                            {pending.length}
                        </span>
                    </div>
                    <div className="adminloans__summary-divider" aria-hidden="true" />
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Savings Withdrawals</span>
                        <span className="adminloans__summary-amount adminloans__summary-amount--amber">
                            {pendingSavings.length}
                        </span>
                    </div>
                    <div className="adminloans__summary-divider" aria-hidden="true" />
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Pending Wire Volume</span>
                        <span className="adminloans__summary-amount adminloans__summary-amount--red">
                            {fmt(totalPendingVolume)}
                        </span>
                    </div>
                </div>
            </header>

            {/* ══ SAVINGS WITHDRAWAL REQUESTS ══ */}
            {pendingSavings.length > 0 && (
                <section className="adminloans__section" aria-label="Pending savings withdrawals">
                    <h2 className="adminloans__section-title">
                        <PiggyBank size={16} style={{ color: "#34d399" }} />
                        Savings Vault Withdrawals
                        <span className="adminloans__section-count">{pendingSavings.length}</span>
                    </h2>
                    <div className="adminloans__cards">
                        {pendingSavings.map(transfer => {
                            const lockId = transfer.note!.replace("SAVINGS_WITHDRAWAL:", "");
                            const lock = lockMap.get(lockId);
                            const principal = lock ? Number(lock.amount) : 0;
                            const interestRate = lock ? Number(lock.interestRatePerDay) : 0.01;
                            const lockDays = lock?.lockDays ?? 0;
                            const interest = +(principal * lockDays * interestRate).toFixed(2);
                            const totalPayout = +(principal + interest).toFixed(2);

                            return (
                                <div
                                    key={transfer.id}
                                    className="adminloans__card adminloans__card--pending"
                                    style={{ borderColor: "rgba(52,211,153,0.3)" }}
                                >
                                    <div className="adminloans__card-header">
                                        <div className="adminloans__card-user">
                                            <div className="adminloans__card-avatar" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                                                {transfer.user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="adminloans__card-user-info">
                                                <span className="adminloans__card-name">{transfer.user.fullName}</span>
                                                <span className="adminloans__card-email">{transfer.user.email}</span>
                                            </div>
                                        </div>
                                        <span className="adminloans__badge status--pending">
                                            <Clock size={10} /> Savings Withdrawal
                                        </span>
                                    </div>

                                    <div className="adminloans__card-body">
                                        <div className="adminloans__card-amount">
                                            <span className="adminloans__card-amount-label">Total Payout (Principal + Interest)</span>
                                            <span className="adminloans__card-amount-value" style={{ color: "#34d399" }}>
                                                {fmt(totalPayout, transfer.currency)}
                                            </span>
                                        </div>

                                        <div className="adminloans__card-details">
                                            <div className="adminloans__card-detail">
                                                <Lock size={12} aria-hidden="true" />
                                                <span>Principal: {fmt(principal, transfer.currency)}</span>
                                            </div>
                                            <div className="adminloans__card-detail">
                                                <TrendingUp size={12} aria-hidden="true" />
                                                <span>Interest: +{fmt(interest, transfer.currency)} ({lockDays} days @ 1%/day)</span>
                                            </div>
                                            <div className="adminloans__card-detail">
                                                <Calendar size={12} aria-hidden="true" />
                                                <span>
                                                    Locked: {lock ? fmtDate(lock.lockedAt) : "—"} → Matured: {lock ? fmtDate(lock.unlocksAt) : "—"}
                                                </span>
                                            </div>
                                            <div className="adminloans__card-detail">
                                                <User size={12} aria-hidden="true" />
                                                <span>Ref: {transfer.reference}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="adminloans__card-meta">
                                        <span>Requested {fmtDate(transfer.createdAt)}</span>
                                        <span>Lock ID: {lockId.slice(0, 12)}</span>
                                    </div>

                                    {lock ? (
                                        <SavingsWithdrawalButtons
                                            transferId={transfer.id}
                                            lockId={lockId}
                                            userName={transfer.user.fullName}
                                            totalPayout={totalPayout}
                                        />
                                    ) : (
                                        <p className="adminloans__no-account">
                                            Cannot process — savings lock record not found.
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Resolved savings */}
            {resolvedSavings.length > 0 && (
                <section className="adminloans__section" aria-label="Resolved savings withdrawals">
                    <h2 className="adminloans__section-title">
                        <PiggyBank size={16} style={{ color: "var(--color-text-muted)" }} />
                        Resolved Savings Withdrawals
                    </h2>
                    <ul className="adminloans__list" role="list">
                        {resolvedSavings.map(transfer => {
                            const meta = STATUS_META[transfer.status as keyof typeof STATUS_META] || STATUS_META.PENDING;
                            const StatusIcon = meta.Icon;
                            return (
                                <li key={transfer.id} className="adminloans__item adminloans__item--muted">
                                    <div className="adminloans__item-icon adminloans__item-icon--muted">
                                        <PiggyBank size={15} aria-hidden="true" />
                                    </div>
                                    <div className="adminloans__item-info">
                                        <span className="adminloans__item-name">{transfer.user.fullName} — Savings Withdrawal</span>
                                        <span className="adminloans__item-meta">
                                            Ref: {transfer.reference.slice(0, 14)} · {fmtDate(transfer.createdAt)}
                                        </span>
                                    </div>
                                    <div className="adminloans__item-right">
                                        <span className="adminloans__item-amount adminloans__item-amount--muted">
                                            {fmt(transfer.amount, transfer.currency)}
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

            {/* ══ WIRE TRANSFERS ══ */}
            {pending.length > 0 && (
                <section className="adminloans__section" aria-label="Pending wire transfers">
                    <h2 className="adminloans__section-title">
                        <Send size={14} />
                        Wire Transfers — Awaiting Action
                        <span className="adminloans__section-count">{pending.length}</span>
                    </h2>
                    <div className="adminloans__cards">
                        {pending.map(transfer => {
                            const checking = transfer.user.accounts[0];
                            const meta = STATUS_META[transfer.status as keyof typeof STATUS_META] || STATUS_META.PENDING;
                            const StatusIcon = meta.Icon;
                            return (
                                <div key={transfer.id} className="adminloans__card adminloans__card--pending">
                                    <div className="adminloans__card-header">
                                        <div className="adminloans__card-user">
                                            <div className="adminloans__card-avatar">
                                                {transfer.user.fullName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="adminloans__card-user-info">
                                                <span className="adminloans__card-name">{transfer.user.fullName}</span>
                                                <span className="adminloans__card-email">{transfer.user.email}</span>
                                            </div>
                                        </div>
                                        <span className={`adminloans__badge ${meta.cls}`}>
                                            <StatusIcon size={10} />
                                            {meta.label}
                                        </span>
                                    </div>

                                    <div className="adminloans__card-body">
                                        <div className="adminloans__card-amount">
                                            <span className="adminloans__card-amount-label">Transfer Amount</span>
                                            <span className="adminloans__card-amount-value">
                                                {fmt(transfer.amount, transfer.currency)}
                                            </span>
                                        </div>

                                        <div className="adminloans__card-details">
                                            <div className="adminloans__card-detail">
                                                <Send size={12} aria-hidden="true" />
                                                <span>To: {transfer.recipientName}</span>
                                            </div>
                                            <div className="adminloans__card-detail">
                                                <Calendar size={12} aria-hidden="true" />
                                                <span>{transfer.recipientBank}</span>
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
                                                <span className="adminloans__card-purpose-label">Dest Account:</span>
                                                <span>{transfer.recipientAccountNumber}</span>
                                            </div>
                                            {transfer.note && (
                                                <div className="adminloans__card-detail adminloans__card-detail--full">
                                                    <span className="adminloans__card-purpose-label">Notes:</span>
                                                    <span>{transfer.note}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="adminloans__card-meta">
                                        <span>Initiated {fmtDate(transfer.createdAt)}</span>
                                        <span>Ref: {transfer.reference.slice(0, 12).toUpperCase()}</span>
                                    </div>

                                    {checking && (
                                        <TransferActionButtons
                                            transferId={transfer.id}
                                            checkingAccountId={checking.id}
                                            amount={Number(transfer.amount)}
                                            userName={transfer.user.fullName}
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

            {/* ── Resolved Wire Transfers ── */}
            {resolved.length > 0 && (
                <section className="adminloans__section" aria-label="Resolved wire transfers">
                    <h2 className="adminloans__section-title">
                        <Send size={14} /> Resolved Wire Transfers
                    </h2>
                    <ul className="adminloans__list" role="list">
                        {resolved.map(transfer => {
                            const meta = STATUS_META[transfer.status as keyof typeof STATUS_META] || STATUS_META.PENDING;
                            const StatusIcon = meta.Icon;
                            const isCompletedInternal =
                                transfer.status === "COMPLETED" &&
                                transfer.recipientBank === "GOLDEN_PRIVATE_WEALTH";
                            return (
                                <li key={transfer.id} className="adminloans__item adminloans__item--muted">
                                    <div className="adminloans__item-icon adminloans__item-icon--muted">
                                        <Send size={15} aria-hidden="true" />
                                    </div>
                                    <div className="adminloans__item-info">
                                        <span className="adminloans__item-name">{transfer.user.fullName} → {transfer.recipientName}</span>
                                        <span className="adminloans__item-meta">
                                            {transfer.recipientBank} · Ref: {transfer.reference.slice(0, 10)} · {fmtDate(transfer.createdAt)}
                                        </span>
                                    </div>
                                    <div className="adminloans__item-right">
                                        <span className="adminloans__item-amount adminloans__item-amount--muted">
                                            {fmt(transfer.amount, transfer.currency)}
                                        </span>
                                        <span className={`adminloans__badge ${meta.cls}`}>
                                            <StatusIcon size={10} /> {meta.label}
                                        </span>
                                        {isCompletedInternal && (
                                            <TransferActionButtons
                                                transferId={transfer.id}
                                                checkingAccountId={transfer.user.accounts[0]?.id ?? ""}
                                                amount={Number(transfer.amount)}
                                                userName={transfer.user.fullName}
                                                isCompletedInternal
                                            />
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {allTransfers.length === 0 && (
                <div className="adminloans__empty">
                    <Send size={32} aria-hidden="true" />
                    <p>No transfers on record.</p>
                </div>
            )}

        </div>
    );
}
