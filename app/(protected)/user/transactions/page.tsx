import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    type LucideIcon,
} from "lucide-react";
import "@/styles/user/transactions.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

// ── Helpers ────────────────────────────────────────────────────────────────

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

function fmtTime(date: Date) {
    return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

const TX_ICON: Record<string, LucideIcon> = {
    DEPOSIT: ArrowDownLeft,
    WITHDRAWAL: ArrowUpRight,
    TRANSFER: ArrowLeftRight,
    YIELD_PAYOUT: ArrowDownLeft,
    ASSET_PURCHASE: ArrowUpRight,
    ASSET_SALE: ArrowDownLeft,
};

const CREDIT_TYPES = new Set(["DEPOSIT", "YIELD_PAYOUT", "ASSET_SALE"]);

const STATUS_CLASS: Record<string, string> = {
    COMPLETED: "badge--success",
    PENDING: "badge--pending",
    FAILED: "badge--error",
    REJECTED: "badge--error",
};

// Group transactions by date label
function groupByDate(txs: { createdAt: Date }[]) {
    const groups: Record<string, number[]> = {};
    txs.forEach((tx, i) => {
        const key = fmtDate(tx.createdAt);
        if (!groups[key]) groups[key] = [];
        groups[key].push(i);
    });
    return groups;
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function TransactionsPage() {
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
        include: { accounts: true },
    });
    if (!user) redirect("/login");

    const accountIds = user.accounts.map(a => a.id);

    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { senderAccountId: { in: accountIds } },
                { receiverAccountId: { in: accountIds } },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            senderAccount: true,
            receiverAccount: true,
        },
    });

    // Totals
    const totalIn = transactions
        .filter(tx => CREDIT_TYPES.has(tx.type))
        .reduce((s, tx) => s + Number(tx.amount), 0);
    const totalOut = transactions
        .filter(tx => !CREDIT_TYPES.has(tx.type) && tx.type !== "TRANSFER")
        .reduce((s, tx) => s + Number(tx.amount), 0);

    const groups = groupByDate(transactions);

    return (
        <div className="txpage">

            {/* ── Header ── */}
            <header className="txpage__header">
                <div>
                    <p className="txpage__pretitle">Account History</p>
                    <h1 className="txpage__title">Transactions</h1>
                </div>
                <div className="txpage__summary">
                    <div className="txpage__summary-item">
                        <span className="txpage__summary-label">Total In</span>
                        <span className="txpage__summary-amount txpage__summary-amount--credit">
                            +{fmt(totalIn)}
                        </span>
                    </div>
                    <div className="txpage__summary-divider" aria-hidden="true" />
                    <div className="txpage__summary-item">
                        <span className="txpage__summary-label">Total Out</span>
                        <span className="txpage__summary-amount txpage__summary-amount--debit">
                            −{fmt(totalOut)}
                        </span>
                    </div>
                    <div className="txpage__summary-divider" aria-hidden="true" />
                    <div className="txpage__summary-item">
                        <span className="txpage__summary-label">Count</span>
                        <span className="txpage__summary-amount">{transactions.length}</span>
                    </div>
                </div>
            </header>

            {/* ── List ── */}
            {transactions.length === 0 ? (
                <div className="txpage__empty">
                    <ArrowLeftRight size={32} aria-hidden="true" />
                    <p>No transactions on record.</p>
                </div>
            ) : (
                <div className="txpage__groups">
                    {Object.entries(groups).map(([date, indices]) => (
                        <div key={date} className="txpage__group">
                            <p className="txpage__group-date">{date}</p>
                            <ul className="txpage__list" role="list">
                                {indices.map(i => {
                                    const tx = transactions[i];
                                    const Icon = TX_ICON[tx.type] ?? ArrowLeftRight;
                                    const isCredit = CREDIT_TYPES.has(tx.type);
                                    const isNeutral = tx.type === "TRANSFER";

                                    // Determine account label
                                    const acctLabel = isCredit
                                        ? tx.receiverAccount?.accountNumber
                                            ? `•••• ${tx.receiverAccount.accountNumber.slice(-4)}`
                                            : "External"
                                        : tx.senderAccount?.accountNumber
                                            ? `•••• ${tx.senderAccount.accountNumber.slice(-4)}`
                                            : "External";

                                    return (
                                        <li key={tx.id} className="txpage__item">
                                            <div className={`txpage__item-icon ${isCredit ? "icon--credit" : isNeutral ? "icon--neutral" : "icon--debit"}`}>
                                                <Icon size={16} aria-hidden="true" />
                                            </div>

                                            <div className="txpage__item-body">
                                                <div className="txpage__item-top">
                                                    <span className="txpage__item-desc">
                                                        {tx.description ?? tx.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                                    </span>
                                                    <span className={`txpage__item-amount ${isCredit ? "amount--credit" : isNeutral ? "amount--neutral" : "amount--debit"}`}>
                                                        {isCredit ? "+" : isNeutral ? "" : "−"}{fmt(tx.amount, tx.currency)}
                                                    </span>
                                                </div>
                                                <div className="txpage__item-bottom">
                                                    <span className="txpage__item-meta">
                                                        {acctLabel} · {fmtTime(tx.createdAt)}
                                                    </span>
                                                    <span className="txpage__item-ref">
                                                        Ref: {tx.referenceId.slice(0, 12).toUpperCase()}
                                                    </span>
                                                    <span className={`txpage__badge ${STATUS_CLASS[tx.status] ?? "badge--pending"}`}>
                                                        {tx.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}