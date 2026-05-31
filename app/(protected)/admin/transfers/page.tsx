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
} from "lucide-react";
import TransferActionButtons from "@/components/admin/TransferActionButtons";
import "@/styles/admin/loans.scss"; // Reusing the layout and styling from loans

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

    const transfers = await prisma.transfer.findMany({
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

    const pending = transfers.filter(t => t.status === "PENDING");
    const resolved = transfers.filter(t => ["COMPLETED", "FAILED", "REJECTED"].includes(t.status));

    const totalPendingVolume = pending.reduce((s, t) => s + Number(t.amount), 0);

    return (
        <div className="adminloans">

            {/* ── Header ── */}
            <header className="adminloans__header">
                <div>
                    <p className="adminloans__pretitle">Payment Operations</p>
                    <h1 className="adminloans__title">Wire Transfers</h1>
                </div>
                <div className="adminloans__summary">
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Awaiting Approval</span>
                        <span className="adminloans__summary-amount adminloans__summary-amount--amber">
                            {pending.length}
                        </span>
                    </div>
                    <div className="adminloans__summary-divider" aria-hidden="true" />
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Processed Transfers</span>
                        <span className="adminloans__summary-amount">{resolved.length}</span>
                    </div>
                    <div className="adminloans__summary-divider" aria-hidden="true" />
                    <div className="adminloans__summary-item">
                        <span className="adminloans__summary-label">Pending Volume</span>
                        <span className="adminloans__summary-amount adminloans__summary-amount--red">
                            {fmt(totalPendingVolume)}
                        </span>
                    </div>
                </div>
            </header>

            {/* ── Pending ── */}
            {pending.length > 0 && (
                <section className="adminloans__section" aria-label="Pending transfers">
                    <h2 className="adminloans__section-title">
                        Awaiting Action
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

                                    {/* Action buttons — client component */}
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

            {/* ── Resolved ── */}
            {resolved.length > 0 && (
                <section className="adminloans__section" aria-label="Resolved transfers">
                    <h2 className="adminloans__section-title">Resolved</h2>
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
                                            {transfer.recipientBank} · Ref: {transfer.reference.slice(0,10)} · {fmtDate(transfer.createdAt)}
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

            {transfers.length === 0 && (
                <div className="adminloans__empty">
                    <Send size={32} aria-hidden="true" />
                    <p>No wire transfers on record.</p>
                </div>
            )}

        </div>
    );
}
