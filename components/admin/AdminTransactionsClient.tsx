"use client";

import { useState, useMemo } from "react";
import {
    Search, X, ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
    Filter, Users, Activity, DollarSign, ChevronDown, type LucideIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type TxType = "DEPOSIT" | "WITHDRAWAL" | "TRANSFER" | "YIELD_PAYOUT" | "ASSET_PURCHASE" | "ASSET_SALE";
type TxStatus = "PENDING" | "COMPLETED" | "FAILED" | "REJECTED";
type Direction = "credit" | "debit";

interface Tx {
    id: string;
    referenceId: string;
    type: TxType;
    status: TxStatus;
    amount: number;
    currency: string;
    description: string | null;
    createdAt: string;
    direction: Direction;
    senderAccount?: { accountNumber: string; user?: { fullName: string } | null } | null;
    receiverAccount?: { accountNumber: string; user?: { fullName: string } | null } | null;
}

interface Account {
    id: string;
    type: string;
    accountNumber: string;
    balance: number;
    currency: string;
    sentTransactions: Tx[];
    receivedTransactions: Tx[];
}

interface User {
    id: string;
    fullName: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
    accounts: Account[];
    totalLoanOwing: number;
}

interface Props {
    users: User[];
    totalVolume: number;
    totalTxCount: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function initials(name: string) {
    const p = name.trim().split(" ");
    return p.length >= 2 ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

const CREDIT_TYPES = new Set<TxType>(["DEPOSIT", "YIELD_PAYOUT", "ASSET_SALE"]);
const TX_ICON: Record<TxType, LucideIcon> = {
    DEPOSIT: ArrowDownLeft, WITHDRAWAL: ArrowUpRight, TRANSFER: ArrowLeftRight,
    YIELD_PAYOUT: ArrowDownLeft, ASSET_PURCHASE: ArrowUpRight, ASSET_SALE: ArrowDownLeft,
};

const STATUS_CLS: Record<TxStatus, string> = {
    COMPLETED: "badge--success", PENDING: "badge--pending",
    FAILED: "badge--error", REJECTED: "badge--error",
};

const TX_TYPES: TxType[] = ["DEPOSIT", "WITHDRAWAL", "TRANSFER", "YIELD_PAYOUT", "ASSET_PURCHASE", "ASSET_SALE"];
const TX_STATUSES: TxStatus[] = ["PENDING", "COMPLETED", "FAILED", "REJECTED"];

// ── Transaction Modal ───────────────────────────────────────────────────────

function TxModal({ user, onClose }: { user: User; onClose: () => void }) {
    const [txSearch, setTxSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<TxType | "ALL">("ALL");
    const [statusFilter, setStatusFilter] = useState<TxStatus | "ALL">("ALL");
    const [showFilters, setShowFilters] = useState(false);

    // Merge all transactions from all accounts
    const allTx = useMemo<Tx[]>(() => {
        const merged: Tx[] = [];
        for (const acct of user.accounts) {
            merged.push(...acct.sentTransactions, ...acct.receivedTransactions);
        }
        // Deduplicate by id and sort by date desc
        const seen = new Set<string>();
        return merged
            .filter(tx => { if (seen.has(tx.id)) return false; seen.add(tx.id); return true; })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [user.accounts]);

    const filtered = useMemo(() => {
        const q = txSearch.toLowerCase();
        return allTx.filter(tx => {
            const matchSearch = !q
                || tx.type.toLowerCase().includes(q)
                || tx.referenceId.toLowerCase().includes(q)
                || (tx.description ?? "").toLowerCase().includes(q)
                || tx.amount.toString().includes(q);
            const matchType = typeFilter === "ALL" || tx.type === typeFilter;
            const matchStatus = statusFilter === "ALL" || tx.status === statusFilter;
            return matchSearch && matchType && matchStatus;
        });
    }, [allTx, txSearch, typeFilter, statusFilter]);


    return (
        <div className="tx-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Transactions for ${user.fullName}`}>
            <div className="tx-modal" onClick={e => e.stopPropagation()}>

                {/* Modal header */}
                <div className="tx-modal__header">
                    <div className="tx-modal__user">
                        <div className="tx-modal__avatar">{initials(user.fullName)}</div>
                        <div>
                            <h2 className="tx-modal__name">{user.fullName}</h2>
                            <p className="tx-modal__email">{user.email}</p>
                        </div>
                    </div>
                    <div className="tx-modal__header-right">
                        <div className="tx-modal__stats">
                            <div className="tx-modal__stat">
                                <span className="tx-modal__stat-label">Savings</span>
                                <span className="tx-modal__stat-value tx-modal__stat-value--credit">
                                    {fmt(user.accounts.find(a => a.type === "SAVINGS")?.balance ?? 0)}
                                </span>
                            </div>
                            <div className="tx-modal__stat-div" />
                            <div className="tx-modal__stat">
                                <span className="tx-modal__stat-label">Checking</span>
                                <span className="tx-modal__stat-value">
                                    {fmt(user.accounts.find(a => a.type === "CHECKING")?.balance ?? 0)}
                                </span>
                            </div>
                            <div className="tx-modal__stat-div" />
                            <div className="tx-modal__stat">
                                <span className="tx-modal__stat-label">Loan</span>
                                <span className="tx-modal__stat-value tx-modal__stat-value--debit">
                                    {fmt(user.totalLoanOwing)}
                                </span>
                            </div>
                            <div className="tx-modal__stat-div" />
                            <div className="tx-modal__stat">
                                <span className="tx-modal__stat-label">Investment</span>
                                <span className="tx-modal__stat-value" style={{ color: "var(--color-gold-400)" }}>
                                    {fmt(user.accounts.find(a => a.type === "INVESTMENT")?.balance ?? 0)}
                                </span>
                            </div>
                        </div>
                        <button className="tx-modal__close" onClick={onClose} aria-label="Close modal">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="tx-modal__toolbar">
                    <div className="tx-modal__search-wrap">
                        <Search size={13} className="tx-modal__search-icon" aria-hidden="true" />
                        <input
                            className="tx-modal__search"
                            type="search"
                            placeholder="Search by type, ref, description…"
                            value={txSearch}
                            onChange={e => setTxSearch(e.target.value)}
                        />
                        {txSearch && (
                            <button className="tx-modal__search-clear" onClick={() => setTxSearch("")} aria-label="Clear">
                                <X size={11} />
                            </button>
                        )}
                    </div>
                    <button
                        className={`tx-modal__filter-toggle ${showFilters ? "active" : ""}`}
                        onClick={() => setShowFilters(p => !p)}
                    >
                        <Filter size={13} aria-hidden="true" />
                        Filters
                        {(typeFilter !== "ALL" || statusFilter !== "ALL") && (
                            <span className="tx-modal__filter-dot" aria-hidden="true" />
                        )}
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="tx-modal__filters">
                        <div className="tx-modal__filter-group">
                            <label className="tx-modal__filter-label">Type</label>
                            <div className="tx-modal__filter-chips">
                                <button
                                    className={`tx-modal__chip ${typeFilter === "ALL" ? "active" : ""}`}
                                    onClick={() => setTypeFilter("ALL")}
                                >All</button>
                                {TX_TYPES.map(t => (
                                    <button
                                        key={t}
                                        className={`tx-modal__chip ${typeFilter === t ? "active" : ""}`}
                                        onClick={() => setTypeFilter(t)}
                                    >
                                        {t.replace(/_/g, " ")}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="tx-modal__filter-group">
                            <label className="tx-modal__filter-label">Status</label>
                            <div className="tx-modal__filter-chips">
                                <button
                                    className={`tx-modal__chip ${statusFilter === "ALL" ? "active" : ""}`}
                                    onClick={() => setStatusFilter("ALL")}
                                >All</button>
                                {TX_STATUSES.map(s => (
                                    <button
                                        key={s}
                                        className={`tx-modal__chip tx-modal__chip--${s.toLowerCase()} ${statusFilter === s ? "active" : ""}`}
                                        onClick={() => setStatusFilter(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {(typeFilter !== "ALL" || statusFilter !== "ALL") && (
                            <button
                                className="tx-modal__clear-filters"
                                onClick={() => { setTypeFilter("ALL"); setStatusFilter("ALL"); }}
                            >
                                <X size={11} /> Clear filters
                            </button>
                        )}
                    </div>
                )}

                {/* Transaction list */}
                <div className="tx-modal__list-wrap">
                    {filtered.length === 0 ? (
                        <div className="tx-modal__empty">
                            <Activity size={24} aria-hidden="true" />
                            <p>No transactions match your filters.</p>
                        </div>
                    ) : (
                        <ul className="tx-modal__list" role="list">
                            {filtered.map(tx => {
                                const isCredit = CREDIT_TYPES.has(tx.type);
                                const isNeutral = tx.type === "TRANSFER";
                                const Icon = TX_ICON[tx.type] ?? ArrowLeftRight;
                                const counterparty = isCredit
                                    ? tx.senderAccount?.user?.fullName ?? tx.senderAccount?.accountNumber ?? "External"
                                    : tx.receiverAccount?.user?.fullName ?? tx.receiverAccount?.accountNumber ?? "External";

                                return (
                                    <li key={tx.id} className="tx-modal__item">
                                        <div className={`tx-modal__item-icon ${isCredit ? "icon--credit" : isNeutral ? "icon--neutral" : "icon--debit"}`}>
                                            <Icon size={14} aria-hidden="true" />
                                        </div>
                                        <div className="tx-modal__item-body">
                                            <div className="tx-modal__item-top">
                                                <span className="tx-modal__item-desc">
                                                    {tx.description ?? tx.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                                </span>
                                                <span className={`tx-modal__item-amount ${isCredit ? "amount--credit" : isNeutral ? "amount--neutral" : "amount--debit"}`}>
                                                    {isCredit ? "+" : isNeutral ? "" : "−"}{fmt(tx.amount, tx.currency)}
                                                </span>
                                            </div>
                                            <div className="tx-modal__item-bottom">
                                                <span className="tx-modal__item-meta">
                                                    {counterparty} · {timeAgo(tx.createdAt)}
                                                </span>
                                                <span className="tx-modal__item-ref">
                                                    {tx.referenceId.slice(0, 10).toUpperCase()}
                                                </span>
                                                <span className={`tx-modal__badge ${STATUS_CLS[tx.status]}`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AdminTransactionsClient({ users, totalVolume, totalTxCount }: Props) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "verified" | "unverified">("ALL");
    const [sortBy, setSortBy] = useState<"name" | "joined" | "txCount">("txCount");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showSort, setShowSort] = useState(false);

    const enriched = useMemo(() => users.map(u => {
        const txCount = u.accounts.reduce((s, a) =>
            s + a.sentTransactions.length + a.receivedTransactions.length, 0);
        const totalBalance = u.accounts.reduce((s, a) => s + a.balance, 0);
        return { ...u, txCount, totalBalance };
    }), [users]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return [...enriched]
            .filter(u => {
                const matchSearch = !q
                    || u.fullName.toLowerCase().includes(q)
                    || u.email.toLowerCase().includes(q);
                const matchStatus = statusFilter === "ALL"
                    || (statusFilter === "verified" && u.emailVerified)
                    || (statusFilter === "unverified" && !u.emailVerified);
                return matchSearch && matchStatus;
            })
            .sort((a, b) => {
                if (sortBy === "name") return a.fullName.localeCompare(b.fullName);
                if (sortBy === "joined") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                if (sortBy === "txCount") return b.txCount - a.txCount;
                return 0;
            });
    }, [enriched, search, statusFilter, sortBy]);

    const SORT_LABELS: Record<typeof sortBy, string> = {
        txCount: "Most Active", name: "Name A–Z", joined: "Newest First",
    };

    return (
        <div className="admintx">

            {/* ── Header ── */}
            <header className="admintx__header">
                <div>
                    <p className="admintx__pretitle">Financial Operations</p>
                    <h1 className="admintx__title">Transactions</h1>
                </div>
                <div className="admintx__summary">
                    <div className="admintx__summary-item">
                        <span className="admintx__summary-label">Total Volume</span>
                        <span className="admintx__summary-amount admintx__summary-amount--gold">
                            {fmt(totalVolume)}
                        </span>
                    </div>
                    <div className="admintx__summary-div" />
                    <div className="admintx__summary-item">
                        <span className="admintx__summary-label">All Transactions</span>
                        <span className="admintx__summary-amount">{totalTxCount.toLocaleString()}</span>
                    </div>
                    <div className="admintx__summary-div" />
                    <div className="admintx__summary-item">
                        <span className="admintx__summary-label">Clients</span>
                        <span className="admintx__summary-amount">{users.length}</span>
                    </div>
                </div>
            </header>

            {/* ── Toolbar ── */}
            <div className="admintx__toolbar">
                <div className="admintx__search-wrap">
                    <Search size={14} className="admintx__search-icon" aria-hidden="true" />
                    <input
                        className="admintx__search"
                        type="search"
                        placeholder="Search clients by name or email…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="admintx__search-clear" onClick={() => setSearch("")} aria-label="Clear">
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Status filter chips */}
                <div className="admintx__chips">
                    {(["ALL", "verified", "unverified"] as const).map(s => (
                        <button
                            key={s}
                            className={`admintx__chip ${statusFilter === s ? "active" : ""}`}
                            onClick={() => setStatusFilter(s)}
                        >
                            {s === "ALL" ? "All Clients" : s === "verified" ? "Verified" : "Unverified"}
                        </button>
                    ))}
                </div>

                {/* Sort dropdown */}
                <div className="admintx__sort-wrap">
                    <button
                        className="admintx__sort-btn"
                        onClick={() => setShowSort(p => !p)}
                        aria-expanded={showSort}
                    >
                        {SORT_LABELS[sortBy]}
                        <ChevronDown size={12} aria-hidden="true" />
                    </button>
                    {showSort && (
                        <div className="admintx__sort-menu">
                            {(["txCount", "name", "joined"] as const).map(opt => (
                                <button
                                    key={opt}
                                    className={`admintx__sort-option ${sortBy === opt ? "active" : ""}`}
                                    onClick={() => { setSortBy(opt); setShowSort(false); }}
                                >
                                    {SORT_LABELS[opt]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── User Grid ── */}
            {filtered.length === 0 ? (
                <div className="admintx__empty">
                    <Users size={28} aria-hidden="true" />
                    <p>No clients match your search.</p>
                </div>
            ) : (
                <>
                    <p className="admintx__count">
                        {filtered.length} of {users.length} clients
                    </p>
                    <div className="admintx__grid">
                        {filtered.map(user => (
                            <button
                                key={user.id}
                                className="admintx__user-card"
                                onClick={() => setSelectedUser(user)}
                                aria-label={`View transactions for ${user.fullName}`}
                            >
                                <div className="admintx__card-top">
                                    <div className="admintx__card-avatar">
                                        {initials(user.fullName)}
                                    </div>
                                    <div className="admintx__card-info">
                                        <span className="admintx__card-name">{user.fullName}</span>
                                        <span className="admintx__card-email">{user.email}</span>
                                    </div>
                                    <span
                                        className={`admintx__card-dot ${user.emailVerified ? "dot--verified" : "dot--unverified"}`}
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="admintx__card-stats">
                                    <div className="admintx__card-stat">
                                        <Activity size={11} aria-hidden="true" />
                                        <span>{user.txCount} transactions</span>
                                    </div>
                                    <div className="admintx__card-stat">
                                        <DollarSign size={11} aria-hidden="true" />
                                        <span>{fmt(user.totalBalance)}</span>
                                    </div>
                                </div>
                                <div className="admintx__card-accounts">
                                    {user.accounts.map(a => (
                                        <span key={a.id} className={`admintx__card-acct-tag acct--${a.type.toLowerCase()}`}>
                                            {a.type.charAt(0) + a.type.slice(1).toLowerCase()}
                                        </span>
                                    ))}
                                </div>
                                <span className="admintx__card-cta">View Transactions →</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* ── Modal ── */}
            {selectedUser && (
                <TxModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}

        </div>
    );
}