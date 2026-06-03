import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    Users,
    ArrowLeftRight,
    Landmark,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    UserCheck,
    UserX,
    Clock,
    Activity,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import "@/styles/admin/overview.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

function fmt(val: number, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(val);
}

function fmtTime(date: Date) {
    return new Intl.DateTimeFormat("en-GB", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default async function AdminOverviewPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    let adminId: string;
    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
        adminId = payload.userId as string;
    } catch {
        redirect("/login");
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) redirect("/login");

    const now = new Date();
    const last24h = new Date(now.getTime() - 1000 * 60 * 60 * 24);
    const last7d = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7);
    const prev24h = new Date(now.getTime() - 1000 * 60 * 60 * 48);

    // ── Parallel data fetch ────────────────────────────────────────────────
    const [
        totalUsers,
        newUsersToday,
        newUsersPrev,
        unverifiedUsers,
        totalTransactions,
        txToday,
        txPrev,
        txVolToday,
        txVolPrev,
        failedTxToday,
        pendingLoans,
        activeLoans,
        newLoansToday,
        pendingKyc,
        recentAuditLogs,
        recentUsers,
        recentTransactions,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: last24h } } }),
        prisma.user.count({ where: { createdAt: { gte: prev24h, lt: last24h } } }),
        prisma.user.count({ where: { emailVerified: false } }),
        prisma.transaction.count(),
        prisma.transaction.count({ where: { createdAt: { gte: last24h } } }),
        prisma.transaction.count({ where: { createdAt: { gte: prev24h, lt: last24h } } }),
        prisma.transaction.aggregate({ where: { createdAt: { gte: last24h }, status: "COMPLETED" }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { createdAt: { gte: prev24h, lt: last24h }, status: "COMPLETED" }, _sum: { amount: true } }),
        prisma.transaction.count({ where: { createdAt: { gte: last24h }, status: { in: ["FAILED", "REJECTED"] } } }),
        prisma.loan.count({ where: { status: { in: ["PENDING", "UNDER_REVIEW"] } } }),
        prisma.loan.count({ where: { status: "ACTIVE" } }),
        prisma.loan.count({ where: { createdAt: { gte: last24h } } }),
        prisma.kYCDocument.count({ where: { verified: false } }),
        prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { fullName: true, email: true } } } }),
        prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, fullName: true, email: true, createdAt: true, emailVerified: true, role: true } }),
        prisma.transaction.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { senderAccount: { select: { user: { select: { fullName: true } } } } } }),
    ]);

    const volToday = Number(txVolToday._sum.amount ?? 0);
    const volPrev = Number(txVolPrev._sum.amount ?? 0);
    const firstName = admin.fullName.split(" ")[0];
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    function delta(curr: number, prev: number) {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
    }

    const userDelta = delta(newUsersToday, newUsersPrev);
    const txDelta = delta(txToday, txPrev);
    const volDelta = delta(volToday, volPrev);

    return (
        <div className="overview">

            {/* ── Header ── */}
            <header className="overview__header">
                <div>
                    <p className="overview__pretitle">{greeting}</p>
                    <h1 className="overview__title">{firstName}</h1>
                </div>
                <div className="overview__header-meta">
                    <span className="overview__timestamp">
                        <Clock size={12} aria-hidden="true" />
                        {fmtTime(now)}
                    </span>
                    <span className="overview__admin-badge">Admin Console</span>
                </div>
            </header>

            {/* ── Stat Cards ── */}
            <div className="overview__stats">

                <div className="overview__stat-card">
                    <div className="overview__stat-icon overview__stat-icon--blue">
                        <Users size={18} aria-hidden="true" />
                    </div>
                    <div className="overview__stat-body">
                        <span className="overview__stat-label">Total Users</span>
                        <span className="overview__stat-value">{totalUsers.toLocaleString()}</span>
                        <span className="overview__stat-sub">
                            +{newUsersToday} today
                            <span className={`overview__delta ${userDelta >= 0 ? "delta--up" : "delta--down"}`}>
                                {userDelta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(userDelta)}%
                            </span>
                        </span>
                    </div>
                </div>

                <div className="overview__stat-card">
                    <div className="overview__stat-icon overview__stat-icon--gold">
                        <ArrowLeftRight size={18} aria-hidden="true" />
                    </div>
                    <div className="overview__stat-body">
                        <span className="overview__stat-label">Transactions (24h)</span>
                        <span className="overview__stat-value">{txToday.toLocaleString()}</span>
                        <span className="overview__stat-sub">
                            {totalTransactions.toLocaleString()} total
                            <span className={`overview__delta ${txDelta >= 0 ? "delta--up" : "delta--down"}`}>
                                {txDelta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(txDelta)}%
                            </span>
                        </span>
                    </div>
                </div>

                <div className="overview__stat-card">
                    <div className="overview__stat-icon overview__stat-icon--green">
                        <Activity size={18} aria-hidden="true" />
                    </div>
                    <div className="overview__stat-body">
                        <span className="overview__stat-label">Volume (24h)</span>
                        <span className="overview__stat-value">{fmt(volToday)}</span>
                        <span className="overview__stat-sub">
                            vs {fmt(volPrev)} prior
                            <span className={`overview__delta ${volDelta >= 0 ? "delta--up" : "delta--down"}`}>
                                {volDelta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                {Math.abs(volDelta)}%
                            </span>
                        </span>
                    </div>
                </div>

                <div className="overview__stat-card">
                    <div className="overview__stat-icon overview__stat-icon--red">
                        <AlertTriangle size={18} aria-hidden="true" />
                    </div>
                    <div className="overview__stat-body">
                        <span className="overview__stat-label">Failed Tx (24h)</span>
                        <span className="overview__stat-value">{failedTxToday}</span>
                        <span className="overview__stat-sub">Failed or rejected</span>
                    </div>
                </div>

                <div className="overview__stat-card">
                    <div className="overview__stat-icon overview__stat-icon--amber">
                        <Landmark size={18} aria-hidden="true" />
                    </div>
                    <div className="overview__stat-body">
                        <span className="overview__stat-label">Loan Applications</span>
                        <span className="overview__stat-value">{pendingLoans}</span>
                        <span className="overview__stat-sub">
                            {activeLoans} active · +{newLoansToday} today
                        </span>
                    </div>
                </div>

                <div className="overview__stat-card">
                    <div className="overview__stat-icon overview__stat-icon--purple">
                        <ShieldAlert size={18} aria-hidden="true" />
                    </div>
                    <div className="overview__stat-body">
                        <span className="overview__stat-label">KYC Pending</span>
                        <span className="overview__stat-value">{pendingKyc}</span>
                        <span className="overview__stat-sub">{unverifiedUsers} unverified emails</span>
                    </div>
                </div>

            </div>

            {/* ── Bottom Grid ── */}
            <div className="overview__grid">

                {/* Recent Users */}
                <section className="overview__panel" aria-label="Recent users">
                    <h2 className="overview__panel-title">New Users</h2>
                    {recentUsers.length === 0 ? (
                        <p className="overview__empty">No users yet.</p>
                    ) : (
                        <ul className="overview__user-list" role="list">
                            {recentUsers.map(u => (
                                <li key={u.id} className="overview__user-item">
                                    <div className="overview__user-avatar">
                                        {u.fullName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overview__user-info">
                                        <span className="overview__user-name">{u.fullName}</span>
                                        <span className="overview__user-email">{u.email}</span>
                                    </div>
                                    <div className="overview__user-right">
                                        <span className="overview__user-time">{timeAgo(u.createdAt)}</span>
                                        <span className={`overview__user-badge ${u.emailVerified ? "badge--verified" : "badge--pending"}`}>
                                            {u.emailVerified
                                                ? <><CheckCircle2 size={9} /> Verified</>
                                                : <><UserX size={9} /> Unverified</>
                                            }
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Recent Transactions */}
                <section className="overview__panel" aria-label="Recent transactions">
                    <h2 className="overview__panel-title">Recent Transactions</h2>
                    {recentTransactions.length === 0 ? (
                        <p className="overview__empty">No transactions yet.</p>
                    ) : (
                        <ul className="overview__tx-list" role="list">
                            {recentTransactions.map(tx => {
                                const isCredit = ["DEPOSIT", "YIELD_PAYOUT", "ASSET_SALE"].includes(tx.type);
                                const isFailed = ["FAILED", "REJECTED"].includes(tx.status);
                                return (
                                    <li key={tx.id} className="overview__tx-item">
                                        <div className={`overview__tx-dot ${isFailed ? "dot--failed" : isCredit ? "dot--credit" : "dot--debit"}`} aria-hidden="true" />
                                        <div className="overview__tx-info">
                                            <span className="overview__tx-desc">
                                                {tx.description ?? tx.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                            </span>
                                            <span className="overview__tx-meta">
                                                {tx.senderAccount?.user?.fullName ?? "External"} · {timeAgo(tx.createdAt)}
                                            </span>
                                        </div>
                                        <div className="overview__tx-right">
                                            <span className={`overview__tx-amount ${isFailed ? "amount--failed" : isCredit ? "amount--credit" : "amount--debit"}`}>
                                                {isCredit ? "+" : "−"}{fmt(Number(tx.amount), tx.currency)}
                                            </span>
                                            <span className={`overview__tx-status status--${tx.status.toLowerCase()}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Audit Log */}
                <section className="overview__panel overview__panel--full" aria-label="Audit log">
                    <h2 className="overview__panel-title">Recent Audit Activity</h2>
                    {recentAuditLogs.length === 0 ? (
                        <p className="overview__empty">No audit entries yet.</p>
                    ) : (
                        <ul className="overview__audit-list" role="list">
                            {recentAuditLogs.map(log => (
                                <li key={log.id} className="overview__audit-item">
                                    <div className="overview__audit-icon">
                                        <Activity size={13} aria-hidden="true" />
                                    </div>
                                    <div className="overview__audit-body">
                                        <span className="overview__audit-action">{log.action}</span>
                                        <span className="overview__audit-meta">
                                            {log.user?.fullName ?? "System"}
                                            {log.ipAddress && <> · {log.ipAddress}</>}
                                        </span>
                                    </div>
                                    <span className="overview__audit-time">{timeAgo(log.createdAt)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </div>
    );
}