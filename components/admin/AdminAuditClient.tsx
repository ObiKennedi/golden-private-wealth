"use client";

import { useState, useMemo } from "react";
import {
    Search, X, Filter, FileText, ChevronDown,
    ShieldAlert, Activity, Users, Clock,
    ChevronRight, Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface AuditLog {
    id: string;
    action: string;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: string | null;
    createdAt: string;
    user: {
        fullName: string;
        email: string;
        role: string;
    } | null;
}

interface Props {
    logs: AuditLog[];
    totalCount: number;
    todayCount: number;
    uniqueActors: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
    }).format(new Date(iso));
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

function initials(name: string) {
    const p = name.trim().split(" ");
    return p.length >= 2 ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

// Derive a category and color from the action string
function categorize(action: string): { label: string; cls: string } {
    const a = action.toUpperCase();
    if (a.includes("LOAN_APPROVED")) return { label: "Loan Approved", cls: "cat--approved" };
    if (a.includes("LOAN_REJECTED")) return { label: "Loan Rejected", cls: "cat--rejected" };
    if (a.includes("LOAN")) return { label: "Loan", cls: "cat--loan" };
    if (a.includes("LOGIN")) return { label: "Auth", cls: "cat--auth" };
    if (a.includes("REGISTER") || a.includes("SIGNUP") || a.includes("SIGN_UP"))
        return { label: "Registration", cls: "cat--register" };
    if (a.includes("PASSWORD")) return { label: "Security", cls: "cat--security" };
    if (a.includes("TRANSFER") || a.includes("TRANSACTION") || a.includes("DEPOSIT") || a.includes("WITHDRAWAL"))
        return { label: "Transaction", cls: "cat--tx" };
    if (a.includes("KYC")) return { label: "KYC", cls: "cat--kyc" };
    if (a.includes("BALANCE") || a.includes("ACCOUNT"))
        return { label: "Account", cls: "cat--account" };
    if (a.includes("ADMIN")) return { label: "Admin", cls: "cat--admin" };
    return { label: "System", cls: "cat--system" };
}

const CATEGORIES = [
    "Auth", "Registration", "Security", "Transaction",
    "Loan Approved", "Loan Rejected", "Loan",
    "KYC", "Account", "Admin", "System",
];

function groupByDate(logs: AuditLog[]) {
    const groups: Record<string, AuditLog[]> = {};
    for (const log of logs) {
        const d = new Date(log.createdAt);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        let key: string;
        if (d >= today) key = "Today";
        else if (d >= yesterday) key = "Yesterday";
        else key = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d);
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
    }
    return groups;
}

// ── Detail Modal ───────────────────────────────────────────────────────────

function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
    const cat = categorize(log.action);
    let parsedMeta: Record<string, unknown> | null = null;
    try { if (log.metadata) parsedMeta = JSON.parse(log.metadata); } catch { }

    return (
        <div className="audit-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div className="audit-modal" onClick={e => e.stopPropagation()}>
                <div className="audit-modal__header">
                    <div className="audit-modal__title-row">
                        <span className={`audit-modal__cat ${cat.cls}`}>{cat.label}</span>
                        <h2 className="audit-modal__title">Log Detail</h2>
                    </div>
                    <button className="audit-modal__close" onClick={onClose} aria-label="Close">
                        <X size={15} />
                    </button>
                </div>

                <div className="audit-modal__body">
                    <div className="audit-modal__field">
                        <span className="audit-modal__field-label">Action</span>
                        <span className="audit-modal__field-value audit-modal__field-value--mono">
                            {log.action}
                        </span>
                    </div>

                    <div className="audit-modal__field">
                        <span className="audit-modal__field-label">Timestamp</span>
                        <span className="audit-modal__field-value">{fmtDate(log.createdAt)}</span>
                    </div>

                    {log.user && (
                        <div className="audit-modal__field">
                            <span className="audit-modal__field-label">Actor</span>
                            <div className="audit-modal__actor">
                                <div className="audit-modal__actor-avatar">{initials(log.user.fullName)}</div>
                                <div>
                                    <span className="audit-modal__actor-name">{log.user.fullName}</span>
                                    <span className="audit-modal__actor-email">{log.user.email}</span>
                                </div>
                                <span className={`audit-modal__role-badge ${log.user.role === "ADMIN" ? "role--admin" : "role--client"}`}>
                                    {log.user.role}
                                </span>
                            </div>
                        </div>
                    )}

                    {!log.user && (
                        <div className="audit-modal__field">
                            <span className="audit-modal__field-label">Actor</span>
                            <span className="audit-modal__field-value audit-modal__field-value--muted">System</span>
                        </div>
                    )}

                    {log.ipAddress && (
                        <div className="audit-modal__field">
                            <span className="audit-modal__field-label">IP Address</span>
                            <span className="audit-modal__field-value audit-modal__field-value--mono">
                                {log.ipAddress}
                            </span>
                        </div>
                    )}

                    {log.userAgent && (
                        <div className="audit-modal__field">
                            <span className="audit-modal__field-label">User Agent</span>
                            <span className="audit-modal__field-value audit-modal__field-value--mono audit-modal__field-value--wrap">
                                {log.userAgent}
                            </span>
                        </div>
                    )}

                    <div className="audit-modal__field">
                        <span className="audit-modal__field-label">Log ID</span>
                        <span className="audit-modal__field-value audit-modal__field-value--mono audit-modal__field-value--muted">
                            {log.id}
                        </span>
                    </div>

                    {parsedMeta && (
                        <div className="audit-modal__field audit-modal__field--full">
                            <span className="audit-modal__field-label">Metadata</span>
                            <pre className="audit-modal__pre">
                                {JSON.stringify(parsedMeta, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function AdminAuditClient({ logs, totalCount, todayCount, uniqueActors }: Props) {
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState<string>("ALL");
    const [showFilters, setShowFilters] = useState(false);
    const [selected, setSelected] = useState<AuditLog | null>(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return logs.filter(log => {
            const matchSearch = !q
                || log.action.toLowerCase().includes(q)
                || (log.user?.fullName.toLowerCase().includes(q) ?? false)
                || (log.user?.email.toLowerCase().includes(q) ?? false)
                || (log.ipAddress?.includes(q) ?? false);
            const matchCat = catFilter === "ALL" || categorize(log.action).label === catFilter;
            return matchSearch && matchCat;
        });
    }, [logs, search, catFilter]);

    const groups = useMemo(() => groupByDate(filtered), [filtered]);

    return (
        <div className="auditpage">

            {/* ── Header ── */}
            <header className="auditpage__header">
                <div>
                    <p className="auditpage__pretitle">Security & Compliance</p>
                    <h1 className="auditpage__title">Audit Log</h1>
                </div>
                <div className="auditpage__summary">
                    <div className="auditpage__summary-item">
                        <FileText size={13} aria-hidden="true" />
                        <div>
                            <span className="auditpage__summary-label">Total Entries</span>
                            <span className="auditpage__summary-value">{totalCount.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="auditpage__summary-div" />
                    <div className="auditpage__summary-item">
                        <Clock size={13} aria-hidden="true" />
                        <div>
                            <span className="auditpage__summary-label">Today</span>
                            <span className="auditpage__summary-value auditpage__summary-value--gold">
                                {todayCount}
                            </span>
                        </div>
                    </div>
                    <div className="auditpage__summary-div" />
                    <div className="auditpage__summary-item">
                        <Users size={13} aria-hidden="true" />
                        <div>
                            <span className="auditpage__summary-label">Unique Actors</span>
                            <span className="auditpage__summary-value">{uniqueActors}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Toolbar ── */}
            <div className="auditpage__toolbar">
                <div className="auditpage__search-wrap">
                    <Search size={14} className="auditpage__search-icon" aria-hidden="true" />
                    <input
                        className="auditpage__search"
                        type="search"
                        placeholder="Search by action, user, IP…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="auditpage__search-clear" onClick={() => setSearch("")} aria-label="Clear">
                            <X size={12} />
                        </button>
                    )}
                </div>

                <button
                    className={`auditpage__filter-toggle ${showFilters ? "active" : ""}`}
                    onClick={() => setShowFilters(p => !p)}
                >
                    <Filter size={13} aria-hidden="true" />
                    Category
                    {catFilter !== "ALL" && <span className="auditpage__filter-dot" aria-hidden="true" />}
                    <ChevronDown size={11} aria-hidden="true" />
                </button>
            </div>

            {/* ── Category filters ── */}
            {showFilters && (
                <div className="auditpage__filters">
                    <div className="auditpage__filter-chips">
                        <button
                            className={`auditpage__chip ${catFilter === "ALL" ? "active" : ""}`}
                            onClick={() => setCatFilter("ALL")}
                        >All</button>
                        {CATEGORIES.map(c => (
                            <button
                                key={c}
                                className={`auditpage__chip auditpage__chip--${c.toLowerCase().replace(/ /g, "-")} ${catFilter === c ? "active" : ""}`}
                                onClick={() => setCatFilter(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    {catFilter !== "ALL" && (
                        <button className="auditpage__clear-filters" onClick={() => setCatFilter("ALL")}>
                            <X size={11} /> Clear
                        </button>
                    )}
                </div>
            )}

            <p className="auditpage__count">
                Showing {filtered.length} of {totalCount.toLocaleString()} entries
                {logs.length < totalCount && " (most recent 500)"}
            </p>

            {/* ── Log groups ── */}
            {filtered.length === 0 ? (
                <div className="auditpage__empty">
                    <ShieldAlert size={28} aria-hidden="true" />
                    <p>No audit entries match your filters.</p>
                </div>
            ) : (
                <div className="auditpage__groups">
                    {Object.entries(groups).map(([date, entries]) => (
                        <div key={date} className="auditpage__group">
                            <div className="auditpage__group-header">
                                <span className="auditpage__group-date">{date}</span>
                                <span className="auditpage__group-count">{entries.length}</span>
                            </div>

                            <ul className="auditpage__list" role="list">
                                {entries.map(log => {
                                    const cat = categorize(log.action);
                                    return (
                                        <li key={log.id}>
                                            <button
                                                className="auditpage__item"
                                                onClick={() => setSelected(log)}
                                                aria-label={`View detail: ${log.action}`}
                                            >
                                                <div className={`auditpage__item-dot ${cat.cls}`} aria-hidden="true" />

                                                <div className="auditpage__item-body">
                                                    <div className="auditpage__item-top">
                                                        <span className="auditpage__item-action">
                                                            {log.action}
                                                        </span>
                                                        <span className="auditpage__item-time">
                                                            {timeAgo(log.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="auditpage__item-bottom">
                                                        <span className={`auditpage__cat-badge ${cat.cls}`}>
                                                            {cat.label}
                                                        </span>
                                                        {log.user && (
                                                            <span className="auditpage__item-actor">
                                                                {log.user.fullName}
                                                            </span>
                                                        )}
                                                        {!log.user && (
                                                            <span className="auditpage__item-actor auditpage__item-actor--system">
                                                                System
                                                            </span>
                                                        )}
                                                        {log.ipAddress && (
                                                            <span className="auditpage__item-ip">
                                                                {log.ipAddress}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <ChevronRight size={13} className="auditpage__item-chevron" aria-hidden="true" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Detail Modal ── */}
            {selected && (
                <DetailModal log={selected} onClose={() => setSelected(null)} />
            )}

        </div>
    );
}