"use client"

import { useState, useMemo } from "react"
import {
    Search, X, ChevronDown, Filter, Users,
    ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
    Activity, PoundSterling, FileText, CheckCircle,
    Clock, XCircle, AlertCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

// ── Types ───────────────────────────────────────────────────────────────────

type TxType = string
type TxStatus = "PENDING" | "COMPLETED" | "FAILED" | "REJECTED" | "CANCELLED"

interface Tx {
    id: string
    referenceId: string
    type: TxType
    status: TxStatus
    amount: number
    currency: string
    description: string | null
    createdAt: string
    direction: "debit" | "credit"
    receiverAccount?: { accountNumber: string; user: { fullName: string } } | null
    senderAccount?: { accountNumber: string; user: { fullName: string } } | null
}

interface Account {
    id: string
    type: "CHECKING" | "SAVINGS" | "INVESTMENT" | "CREDIT"
    accountNumber: string
    balance: number
    currency: string
    sentTransactions: Tx[]
    receivedTransactions: Tx[]
}

interface User {
    id: string
    fullName: string
    email: string
    emailVerified: boolean
    createdAt: string
    accounts: Account[]
    totalLoanOwing: number
    _count: { transfers: number; loans: number }
}

interface Props {
    users: User[]
    totalAUM: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency === "USD" ? "GBP" : currency, minimumFractionDigits: 2 }).format(n)
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-GB", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    }).format(new Date(iso))
}

function fmtDateShort(iso: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    }).format(new Date(iso))
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

function initials(name: string) {
    const p = name.trim().split(" ")
    return p.length >= 2 ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase()
}

const TX_STATUSES: TxStatus[] = ["PENDING", "COMPLETED", "FAILED", "REJECTED"]

const DIRECTION_ICON: Record<"debit" | "credit" | "neutral", LucideIcon> = {
    credit: ArrowDownLeft,
    debit: ArrowUpRight,
    neutral: ArrowLeftRight,
}

const STATUS_CLS: Record<TxStatus, string> = {
    COMPLETED: "badge--success",
    PENDING: "badge--pending",
    FAILED: "badge--error",
    REJECTED: "badge--error",
    CANCELLED: "badge--error",
}

const STATUS_ICON: Record<TxStatus, LucideIcon> = {
    COMPLETED: CheckCircle,
    PENDING: Clock,
    FAILED: XCircle,
    REJECTED: XCircle,
    CANCELLED: XCircle,
}

// ── Receipt Modal ────────────────────────────────────────────────────────────

function ReceiptModal({ tx, ownerName, onClose }: { tx: Tx; ownerName: string; onClose: () => void }) {
    const dir = tx.direction
    const StatusIcon = STATUS_ICON[tx.status] ?? Clock
    const counterpartyLabel = dir === "debit" ? "Recipient" : "Sender"
    const counterparty = dir === "debit"
        ? tx.receiverAccount?.user?.fullName ?? "—"
        : tx.senderAccount?.user?.fullName ?? "—"
    const counterpartyAcct = dir === "debit"
        ? tx.receiverAccount?.accountNumber ?? "—"
        : tx.senderAccount?.accountNumber ?? "—"

    const isLoan = tx.type.includes("LOAN")

    return (
        <div className="tx-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Transaction Receipt">
            <div className="tx-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>

                {/* Header */}
                <div className="tx-modal__header" style={{ flexDirection: "column", alignItems: "flex-start", gap: "var(--space-3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-gold-400)" }}>
                            <FileText size={16} />
                            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                {isLoan ? "Loan Record" : "Transaction Receipt"}
                            </span>
                        </div>
                        <button className="tx-modal__close" onClick={onClose} aria-label="Close receipt">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Amount hero */}
                    <div style={{ width: "100%", textAlign: "center", padding: "var(--space-4) 0 var(--space-2)" }}>
                        <p style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "var(--space-1)" }}>
                            {dir === "credit" ? "Received" : "Sent"}
                        </p>
                        <p style={{
                            fontFamily: "var(--font-display)", fontSize: "var(--font-size-3xl)",
                            fontWeight: 300, letterSpacing: "-0.02em",
                            color: dir === "credit" ? "#4ade80" : "#f87171",
                        }}>
                            {dir === "credit" ? "+" : "−"}{fmt(tx.amount, tx.currency)}
                        </p>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                            <StatusIcon size={13} style={{ color: tx.status === "COMPLETED" ? "#4ade80" : tx.status === "PENDING" ? "var(--color-gold-400)" : "#f87171" }} />
                            <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                {tx.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details list */}
                <div className="tx-modal__list-wrap" style={{ padding: "var(--space-4) var(--space-6) var(--space-6)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid var(--color-border-subtle)" }}>

                        {[
                            { label: "Reference", value: tx.referenceId },
                            { label: "Type", value: tx.type.replace(/_/g, " ") },
                            { label: "Description", value: tx.description || "—" },
                            { label: "Account Holder", value: ownerName },
                            { label: counterpartyLabel, value: counterparty },
                            { label: `${counterpartyLabel} Account`, value: counterpartyAcct },
                            { label: "Date & Time", value: fmtDate(tx.createdAt) },
                            ...(isLoan ? [
                                { label: "Loan Amount", value: fmt(tx.amount, tx.currency) },
                                { label: "Note", value: "Loan repayments and disbursements are tracked in the Loans section." },
                            ] : []),
                        ].map(({ label, value }) => (
                            <div key={label} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                                padding: "var(--space-3) 0",
                                borderBottom: "1px solid var(--color-border-subtle)",
                                gap: "var(--space-4)",
                            }}>
                                <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0 }}>
                                    {label}
                                </span>
                                <span style={{ fontFamily: label === "Reference" ? "var(--font-mono)" : "var(--font-body)", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", textAlign: "right", wordBreak: "break-all" }}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Transaction Modal ────────────────────────────────────────────────────────

function TxModal({ user, onClose }: { user: User; onClose: () => void }) {
    const [txSearch, setTxSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<TxStatus | "ALL">("ALL")
    const [dirFilter, setDirFilter] = useState<"ALL" | "debit" | "credit">("ALL")
    const [showFilters, setShowFilters] = useState(false)
    const [selectedTx, setSelectedTx] = useState<Tx | null>(null)

    const allTx = useMemo<Tx[]>(() => {
        const merged: Tx[] = []
        const seen = new Set<string>()
        for (const acct of user.accounts) {
            for (const tx of acct.sentTransactions) {
                const key = tx.id + "-debit"
                if (!seen.has(key)) { seen.add(key); merged.push(tx) }
            }
            for (const tx of acct.receivedTransactions) {
                const key = tx.id + "-credit"
                if (!seen.has(key)) { seen.add(key); merged.push(tx) }
            }
        }
        return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [user.accounts])

    const filtered = useMemo(() => {
        const q = txSearch.toLowerCase()
        return allTx.filter(tx => {
            const matchSearch = !q
                || tx.type.toLowerCase().replace(/_/g, " ").includes(q)
                || tx.referenceId.toLowerCase().includes(q)
                || (tx.description ?? "").toLowerCase().includes(q)
                || tx.amount.toString().includes(q)
            const matchStatus = statusFilter === "ALL" || tx.status === statusFilter
            const matchDir = dirFilter === "ALL" || tx.direction === dirFilter
            return matchSearch && matchStatus && matchDir
        })
    }, [allTx, txSearch, statusFilter, dirFilter])

    const hasFilters = statusFilter !== "ALL" || dirFilter !== "ALL"

    return (
        <>
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
                                placeholder="Search transactions…"
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
                            {hasFilters && <span className="tx-modal__filter-dot" />}
                        </button>
                    </div>

                    {/* Filter panel */}
                    {showFilters && (
                        <div className="tx-modal__filters">
                            <div className="tx-modal__filter-group">
                                <span className="tx-modal__filter-label">Status</span>
                                <div className="tx-modal__filter-chips">
                                    <button className={`tx-modal__chip ${statusFilter === "ALL" ? "active" : ""}`} onClick={() => setStatusFilter("ALL")}>All</button>
                                    {TX_STATUSES.map(s => (
                                        <button key={s} className={`tx-modal__chip tx-modal__chip--${s.toLowerCase()} ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s}</button>
                                    ))}
                                </div>
                            </div>
                            <div className="tx-modal__filter-group">
                                <span className="tx-modal__filter-label">Dir</span>
                                <div className="tx-modal__filter-chips">
                                    {(["ALL", "credit", "debit"] as const).map(d => (
                                        <button key={d} className={`tx-modal__chip ${dirFilter === d ? "active" : ""}`} onClick={() => setDirFilter(d)}>
                                            {d === "ALL" ? "All" : d === "credit" ? "Inbound" : "Outbound"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {hasFilters && (
                                <button className="tx-modal__clear-filters" onClick={() => { setStatusFilter("ALL"); setDirFilter("ALL") }}>
                                    <X size={10} /> Clear filters
                                </button>
                            )}
                        </div>
                    )}

                    {/* Transaction list */}
                    <div className="tx-modal__list-wrap">
                        {filtered.length === 0 ? (
                            <div className="tx-modal__empty">
                                <ArrowLeftRight size={24} aria-hidden="true" />
                                <p>No transactions match your filters.</p>
                            </div>
                        ) : (
                            <ul className="tx-modal__list">
                                {filtered.map(tx => {
                                    const dir = tx.direction
                                    const IconComp = DIRECTION_ICON[dir]
                                    const iconCls = dir === "credit" ? "icon--credit" : "icon--debit"
                                    const amountCls = dir === "credit" ? "amount--credit" : "amount--debit"
                                    const counterparty = dir === "debit"
                                        ? tx.receiverAccount?.user?.fullName
                                        : tx.senderAccount?.user?.fullName
                                    return (
                                        <li
                                            key={tx.id + dir}
                                            className="tx-modal__item"
                                            onClick={() => setSelectedTx(tx)}
                                            style={{ cursor: "pointer" }}
                                            title="Click to view receipt"
                                        >
                                            <div className={`tx-modal__item-icon ${iconCls}`}>
                                                <IconComp size={15} aria-hidden="true" />
                                            </div>
                                            <div className="tx-modal__item-body">
                                                <div className="tx-modal__item-top">
                                                    <span className="tx-modal__item-desc">
                                                        {tx.description || tx.type.replace(/_/g, " ")}
                                                        {counterparty && (
                                                            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
                                                                {" "}· {dir === "debit" ? "To" : "From"} {counterparty}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className={`tx-modal__item-amount ${amountCls}`}>
                                                        {dir === "credit" ? "+" : "−"}{fmt(tx.amount, tx.currency)}
                                                    </span>
                                                </div>
                                                <div className="tx-modal__item-bottom">
                                                    <span className="tx-modal__item-meta">
                                                        {fmtDateShort(tx.createdAt)} · {timeAgo(tx.createdAt)}
                                                    </span>
                                                    <span className="tx-modal__item-ref">{tx.referenceId.slice(0, 14).toUpperCase()}</span>
                                                    <span className={`tx-modal__badge ${STATUS_CLS[tx.status] ?? "badge--pending"}`}>
                                                        {tx.status}
                                                    </span>
                                                    <span style={{ fontFamily: "var(--font-body)", fontSize: "9px", color: "var(--color-gold-700)", letterSpacing: "0.08em", textTransform: "uppercase", marginLeft: "auto" }}>
                                                        View receipt →
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Receipt overlay */}
            {selectedTx && (
                <ReceiptModal
                    tx={selectedTx}
                    ownerName={user.fullName}
                    onClose={() => setSelectedTx(null)}
                />
            )}
        </>
    )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AdminTransactionsClient({ users, totalAUM }: Props) {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "verified" | "unverified">("ALL")
    const [sortBy, setSortBy] = useState<"txCount" | "name" | "joined">("txCount")
    const [showSort, setShowSort] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    const enriched = useMemo(() => users.map(u => {
        const txCount = u.accounts.reduce(
            (s, a) => s + a.sentTransactions.length + a.receivedTransactions.length, 0
        )
        const totalBalance = u.accounts.reduce((s, a) => s + a.balance, 0)
        return { ...u, txCount, totalBalance }
    }), [users])

    const totalTxCount = useMemo(() => enriched.reduce((s, u) => s + u.txCount, 0), [enriched])

    const filtered = useMemo(() =>
        enriched
            .filter(u => {
                const q = search.toLowerCase()
                const matchSearch = !q || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
                const matchStatus =
                    statusFilter === "ALL" ||
                    (statusFilter === "verified" && u.emailVerified) ||
                    (statusFilter === "unverified" && !u.emailVerified)
                return matchSearch && matchStatus
            })
            .sort((a, b) => {
                if (sortBy === "name") return a.fullName.localeCompare(b.fullName)
                if (sortBy === "joined") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                if (sortBy === "txCount") return b.txCount - a.txCount
                return 0
            }),
        [enriched, search, statusFilter, sortBy]
    )

    const SORT_LABELS: Record<typeof sortBy, string> = {
        txCount: "Most Active", name: "Name A–Z", joined: "Newest First",
    }

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
                            {fmt(totalAUM)}
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

                <div className="admintx__chips">
                    {(["ALL", "verified", "unverified"] as const).map(s => (
                        <button key={s} className={`admintx__chip ${statusFilter === s ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
                            {s === "ALL" ? "All Clients" : s === "verified" ? "Verified" : "Unverified"}
                        </button>
                    ))}
                </div>

                <div className="admintx__sort-wrap">
                    <button className="admintx__sort-btn" onClick={() => setShowSort(p => !p)} aria-expanded={showSort}>
                        {SORT_LABELS[sortBy]}
                        <ChevronDown size={12} aria-hidden="true" />
                    </button>
                    {showSort && (
                        <div className="admintx__sort-menu">
                            {(["txCount", "name", "joined"] as const).map(opt => (
                                <button key={opt} className={`admintx__sort-option ${sortBy === opt ? "active" : ""}`} onClick={() => { setSortBy(opt); setShowSort(false) }}>
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
                    <p className="admintx__count">{filtered.length} of {users.length} clients</p>
                    <div className="admintx__grid">
                        {filtered.map(user => (
                            <button
                                key={user.id}
                                className="admintx__user-card"
                                onClick={() => setSelectedUser(user)}
                                aria-label={`View transactions for ${user.fullName}`}
                            >
                                <div className="admintx__card-top">
                                    <div className="admintx__card-avatar">{initials(user.fullName)}</div>
                                    <div className="admintx__card-info">
                                        <span className="admintx__card-name">{user.fullName}</span>
                                        <span className="admintx__card-email">{user.email}</span>
                                    </div>
                                    <span className={`admintx__card-dot ${user.emailVerified ? "dot--verified" : "dot--unverified"}`} aria-hidden="true" />
                                </div>
                                <div className="admintx__card-stats">
                                    <div className="admintx__card-stat">
                                        <Activity size={11} aria-hidden="true" />
                                        <span>{user.txCount} transactions</span>
                                    </div>
                                    <div className="admintx__card-stat">
                                        <PoundSterling size={11} aria-hidden="true" />
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

            {/* ── Transaction Modal ── */}
            {selectedUser && (
                <TxModal user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}
        </div>
    )
}