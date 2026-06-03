"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
    Search, ChevronDown, ChevronUp, BadgeCheck,
    Users, PoundSterling, TrendingUp, X, Wallet,
    Edit, ShieldAlert, Trash2, AlertCircle
} from "lucide-react"
import { updateAccountBalanceAction } from "@/actions/admin"
import { updateUserAction, suspendUserAction, unsuspendUserAction, deleteUserAction } from "@/actions/admin/users"

type AccountType = "CHECKING" | "SAVINGS" | "INVESTMENT" | "CREDIT"
type BalancePreset =
    | { label: string; delta: number; absolute?: never }
    | { label: string; absolute: number; delta?: never }

interface Account {
    id: string
    type: AccountType
    currency: string
    balance: number
    accountNumber: string
}

interface User {
    id: string
    fullName: string
    email: string
    accountNumber: string
    ssn: string
    status: string
    suspendedUntil: string | null
    role: string
    emailVerified: boolean
    avatarUrl: string | null
    createdAt: string
    accounts: Account[]
    _count: { transfers: number; loans: number }
}

interface Props {
    users: User[]
    totalAUM: number
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    CHECKING: "Checking",
    SAVINGS: "Savings",
    INVESTMENT: "Investment",
    CREDIT: "Credit",
}

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
    CHECKING: "type--checking",
    SAVINGS: "type--savings",
    INVESTMENT: "type--investment",
    CREDIT: "type--credit",
}

const BALANCE_PRESETS: BalancePreset[] = [
    { label: "+ £1,000", delta: 1_000 },
    { label: "+ £5,000", delta: 5_000 },
    { label: "+ £10,000", delta: 10_000 },
    { label: "+ £50,000", delta: 50_000 },
    { label: "+ £100,000", delta: 100_000 },
    { label: "+ £500,000", delta: 500_000 },
    { label: "+ £1,000,000", delta: 1_000_000 },
    { label: "− £1,000", delta: -1_000 },
    { label: "− £5,000", delta: -5_000 },
    { label: "− £10,000", delta: -10_000 },
    { label: "− £50,000", delta: -50_000 },
    { label: "Set to £0", absolute: 0 },
]

function fmt(n: number, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", {
        style: "currency", currency, minimumFractionDigits: 2
    }).format(n)
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric", month: "short", year: "numeric"
    }).format(new Date(iso))
}

function initials(name: string) {
    const p = name.trim().split(" ")
    return p.length >= 2
        ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase()
}

export default function AdminUsersClient({ users: initialUsers, totalAUM }: Props) {
    const router = useRouter()
    const [users, setUsers] = useState(initialUsers)
    const [search, setSearch] = useState("")
    const [sortField, setSortField] = useState<"createdAt" | "fullName">("createdAt")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    const [selectedAccount, setSelectedAccount] = useState<Record<string, string>>({})
    const [customAmount, setCustomAmount] = useState<Record<string, string>>({})
    const [customMode, setCustomMode] = useState<Record<string, "add" | "subtract" | "set">>({})
    const [isPending, startTransition] = useTransition()
    const [feedbacks, setFeedbacks] = useState<Record<string, { text: string; accountId: string }>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [editUser, setEditUser] = useState<User | null>(null)
    const [editForm, setEditForm] = useState({ fullName: "", email: "", ssn: "", avatarUrl: "" })
    const [editError, setEditError] = useState("")

    const [suspendUser, setSuspendUser] = useState<User | null>(null)
    const [suspendDays, setSuspendDays] = useState("7")
    const [suspendError, setSuspendError] = useState("")

    const [deleteUser, setDeleteUser] = useState<User | null>(null)
    const [deleteError, setDeleteError] = useState("")

    const verifiedCount = useMemo(() => users.filter((u) => u.emailVerified).length, [users])

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return [...users]
            .filter((u) =>
                u.fullName.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.accountNumber.toLowerCase().includes(q)
            )
            .sort((a, b) => {
                let cmp = 0
                if (sortField === "fullName") cmp = a.fullName.localeCompare(b.fullName)
                if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                return sortDir === "asc" ? cmp : -cmp
            })
    }, [users, search, sortField, sortDir])

    const toggleSort = (field: typeof sortField) => {
        if (sortField === field) setSortDir((d) => d === "asc" ? "desc" : "asc")
        else { setSortField(field); setSortDir("desc") }
    }

    const SortIcon = ({ field }: { field: typeof sortField }) =>
        sortField === field
            ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
            : <ChevronDown size={12} className="sort-icon--inactive" />

    const getActiveAccount = (user: User): Account | null => {
        if (!user.accounts.length) return null
        const id = selectedAccount[user.id]
        return user.accounts.find((a) => a.id === id) ?? user.accounts[0]
    }

    const applyBalance = (userId: string, accountId: string, newBalance: number) => {
        if (newBalance < 0) {
            setErrors((p) => ({ ...p, [userId]: "Balance cannot go below £0." }))
            return
        }
        setErrors((p) => ({ ...p, [userId]: "" }))
        startTransition(async () => {
            const result = await updateAccountBalanceAction(accountId, newBalance)
            if (result?.error) { setErrors((p) => ({ ...p, [userId]: result.error })); return }
            setUsers((prev) => prev.map((u) =>
                u.id !== userId ? u : {
                    ...u,
                    accounts: u.accounts.map((a) =>
                        a.id === accountId ? { ...a, balance: newBalance } : a
                    )
                }
            ))
            setFeedbacks((p) => ({ ...p, [userId]: { text: fmt(newBalance), accountId } }))
            setOpenDropdown(null)
            setTimeout(() => setFeedbacks((p) => ({ ...p, [userId]: { text: "", accountId: "" } })), 3000)
            router.refresh()
        })
    }

    const handlePreset = (user: User, preset: BalancePreset) => {
        const account = getActiveAccount(user)
        if (!account) return
        const next = preset.absolute !== undefined ? preset.absolute : account.balance + preset.delta
        applyBalance(user.id, account.id, next)
    }

    const handleCustomSubmit = (user: User) => {
        const account = getActiveAccount(user)
        if (!account) return
        const raw = parseFloat(customAmount[user.id] ?? "")
        const mode = customMode[user.id] ?? "add"
        if (isNaN(raw) || raw < 0) { setErrors((p) => ({ ...p, [user.id]: "Enter a valid positive number." })); return }
        let next = account.balance
        if (mode === "add") next = account.balance + raw
        if (mode === "subtract") next = account.balance - raw
        if (mode === "set") next = raw
        applyBalance(user.id, account.id, next)
    }

    const handleEditSubmit = () => {
        if (!editUser) return
        setEditError("")
        startTransition(async () => {
            const result = await updateUserAction(editUser.id, editForm)
            if (result.error) { setEditError(result.error) }
            else { setUsers(users.map(u => u.id === editUser.id ? { ...u, ...editForm } : u)); setEditUser(null); router.refresh() }
        })
    }

    const handleSuspendSubmit = () => {
        if (!suspendUser) return
        setSuspendError("")
        const days = parseInt(suspendDays)
        if (isNaN(days) || days <= 0) { setSuspendError("Please enter a valid number of days."); return }
        startTransition(async () => {
            const result = await suspendUserAction(suspendUser.id, days)
            if (result.error) { setSuspendError(result.error) }
            else { setUsers(users.map(u => u.id === suspendUser.id ? { ...u, status: "SUSPENDED" } : u)); setSuspendUser(null); router.refresh() }
        })
    }

    const handleUnsuspend = () => {
        if (!suspendUser) return
        setSuspendError("")
        startTransition(async () => {
            const result = await unsuspendUserAction(suspendUser.id)
            if (result.error) { setSuspendError(result.error) }
            else { setUsers(users.map(u => u.id === suspendUser.id ? { ...u, status: "ACTIVE", suspendedUntil: null } : u)); setSuspendUser(null); router.refresh() }
        })
    }

    const handleDeleteSubmit = () => {
        if (!deleteUser) return
        setDeleteError("")
        startTransition(async () => {
            const result = await deleteUserAction(deleteUser.id)
            if (result.error) { setDeleteError(result.error) }
            else { setUsers(users.filter(u => u.id !== deleteUser.id)); setDeleteUser(null); router.refresh() }
        })
    }

    return (
        <div className="adminusers__inner">

            {/* ── Header ── */}
            <header className="adminusers__header">
                <div>
                    <p className="adminusers__pretitle">Administration</p>
                    <h1 className="adminusers__title">User Management</h1>
                </div>
                <div className="adminusers__header-stats">
                    <div className="adminusers__hstat">
                        <Users size={13} aria-hidden />
                        <span>{users.length} clients</span>
                    </div>
                    <div className="adminusers__hstat">
                        <BadgeCheck size={13} aria-hidden />
                        <span>{verifiedCount} verified</span>
                    </div>
                    <div className="adminusers__hstat adminusers__hstat--gold">
                        <PoundSterling size={13} aria-hidden />
                        <span>{fmt(totalAUM)} total AUM</span>
                    </div>
                </div>
            </header>

            {/* ── Toolbar ── */}
            <div className="adminusers__toolbar">
                <div className="adminusers__search-wrap">
                    <Search size={14} className="adminusers__search-icon" aria-hidden />
                    <input
                        className="adminusers__search"
                        type="search"
                        placeholder="Search by name, email or account…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="adminusers__search-clear" onClick={() => setSearch("")} aria-label="Clear">
                            <X size={12} />
                        </button>
                    )}
                </div>
                <div className="adminusers__sort-strip">
                    <span className="adminusers__sort-label">Sort:</span>
                    {(["fullName", "createdAt"] as const).map((f) => (
                        <button key={f} className={`adminusers__sort-btn${sortField === f ? " active" : ""}`} onClick={() => toggleSort(f)}>
                            {f === "fullName" ? "Name" : "Joined"}
                            <SortIcon field={f} />
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            {filtered.length === 0 ? (
                <div className="adminusers__empty">
                    <Users size={28} aria-hidden />
                    <p>No users match your search.</p>
                </div>
            ) : (
                <div className="adminusers__table-wrap">
                    <table className="adminusers__table">
                        <thead>
                            <tr>
                                <th><button onClick={() => toggleSort("fullName")} className="adminusers__th-btn">Client <SortIcon field="fullName" /></button></th>
                                <th>Accounts</th>
                                <th>Activity</th>
                                <th><button onClick={() => toggleSort("createdAt")} className="adminusers__th-btn">Joined <SortIcon field="createdAt" /></button></th>
                                <th>Manage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user) => {
                                const isOpen = openDropdown === user.id
                                const feedback = feedbacks[user.id]
                                const error = errors[user.id]
                                const active = getActiveAccount(user)
                                const totalUser = user.accounts.reduce((s, a) => s + a.balance, 0)

                                return (
                                    <tr key={user.id} className={isOpen ? "adminusers__row--active" : ""}>

                                        {/* Client */}
                                        <td>
                                            <div className="adminusers__client">
                                                <div className="adminusers__avatar" style={user.status === "SUSPENDED" ? { opacity: 0.5 } : {}}>
                                                    {user.avatarUrl
                                                        ? <img src={user.avatarUrl} alt={user.fullName} />
                                                        : <span>{initials(user.fullName)}</span>}
                                                </div>
                                                <div className="adminusers__client-info">
                                                    <span className="adminusers__client-name" style={user.status === "SUSPENDED" ? { color: "#ef4444" } : {}}>
                                                        {user.fullName} {user.status === "SUSPENDED" && "(Suspended)"}
                                                    </span>
                                                    <span className="adminusers__client-email">{user.email}</span>
                                                </div>
                                                <span
                                                    className={`adminusers__verified-dot${user.emailVerified ? " adminusers__verified-dot--yes" : ""}`}
                                                    title={user.emailVerified ? "Email verified" : "Unverified"}
                                                />
                                            </div>
                                        </td>

                                        {/* Accounts */}
                                        <td>
                                            {user.accounts.length === 0 ? (
                                                <span className="adminusers__no-accounts">No accounts</span>
                                            ) : (
                                                <div className="adminusers__accounts">
                                                    {user.accounts.map((acc) => (
                                                        <div key={acc.id} className="adminusers__account-row">
                                                            <span className={`adminusers__account-type ${ACCOUNT_TYPE_COLORS[acc.type]}`}>
                                                                {ACCOUNT_TYPE_LABELS[acc.type]}
                                                            </span>
                                                            <span className="adminusers__account-balance">
                                                                {fmt(acc.balance, acc.currency)}
                                                                {feedback?.accountId === acc.id && feedback.text && (
                                                                    <span className="adminusers__balance-feedback">
                                                                        <TrendingUp size={9} aria-hidden /> {feedback.text}
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    <div className="adminusers__account-total">Total: {fmt(totalUser)}</div>
                                                </div>
                                            )}
                                        </td>

                                        {/* Activity */}
                                        <td>
                                            <div className="adminusers__activity">
                                                <span>{user._count.transfers} transfers</span>
                                                <span>{user._count.loans} loans</span>
                                            </div>
                                        </td>

                                        {/* Joined */}
                                        <td>
                                            <span className="adminusers__mono adminusers__mono--sm">{fmtDate(user.createdAt)}</span>
                                        </td>

                                        {/* Manage */}
                                        <td className="adminusers__action-cell">
                                            <div className="adminusers__dropdown-wrap" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                {user.accounts.length > 0 && (
                                                    <button
                                                        className={`adminusers__dropdown-trigger${isOpen ? " open" : ""}`}
                                                        onClick={() => setOpenDropdown(isOpen ? null : user.id)}
                                                        disabled={isPending}
                                                        aria-expanded={isOpen}
                                                    >
                                                        Adjust <ChevronDown size={12} aria-hidden />
                                                    </button>
                                                )}
                                                <button className="adminusers__icon-btn edit-btn" onClick={() => { setEditUser(user); setEditForm({ fullName: user.fullName, email: user.email, ssn: user.ssn || "", avatarUrl: user.avatarUrl || "" }) }} title="Edit User">
                                                    <Edit size={14} />
                                                </button>
                                                <button className="adminusers__icon-btn suspend-btn" onClick={() => setSuspendUser(user)} title="Suspend User">
                                                    <ShieldAlert size={14} color={user.status === "SUSPENDED" ? "#f59e0b" : "currentColor"} />
                                                </button>
                                                <button className="adminusers__icon-btn delete-btn" onClick={() => setDeleteUser(user)} title="Delete User">
                                                    <Trash2 size={14} color="#ef4444" />
                                                </button>

                                                {isOpen && (
                                                    <div className="adminusers__dropdown" role="dialog" aria-label={`Adjust balance for ${user.fullName}`}>
                                                        <div className="adminusers__dropdown-header">
                                                            <div className="adminusers__dropdown-header-left">
                                                                <Wallet size={13} aria-hidden />
                                                                <span>{user.fullName}</span>
                                                            </div>
                                                            <button className="adminusers__dropdown-close" onClick={() => setOpenDropdown(null)} aria-label="Close"><X size={12} /></button>
                                                        </div>

                                                        <div className="adminusers__account-selector">
                                                            <p className="adminusers__selector-label">Select Account</p>
                                                            <div className="adminusers__selector-tabs">
                                                                {user.accounts.map((acc) => (
                                                                    <button
                                                                        key={acc.id}
                                                                        className={`adminusers__selector-tab${(selectedAccount[user.id] ?? user.accounts[0].id) === acc.id ? " active" : ""}`}
                                                                        onClick={() => setSelectedAccount((p) => ({ ...p, [user.id]: acc.id }))}
                                                                    >
                                                                        <span className={`adminusers__tab-type ${ACCOUNT_TYPE_COLORS[acc.type]}`}>{ACCOUNT_TYPE_LABELS[acc.type]}</span>
                                                                        <span className="adminusers__tab-balance">{fmt(acc.balance, acc.currency)}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {active && (
                                                                <p className="adminusers__active-balance">
                                                                    Current balance: <strong>{fmt(active.balance, active.currency)}</strong>
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="adminusers__presets">
                                                            {BALANCE_PRESETS.map((preset) => (
                                                                <button
                                                                    key={preset.label}
                                                                    className={`adminusers__preset${preset.delta !== undefined && preset.delta < 0 ? " adminusers__preset--neg" : ""}`}
                                                                    onClick={() => handlePreset(user, preset)}
                                                                    disabled={isPending}
                                                                >
                                                                    {preset.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div className="adminusers__custom">
                                                            <p className="adminusers__custom-label">Custom amount</p>
                                                            <div className="adminusers__custom-row">
                                                                <select
                                                                    className="adminusers__custom-mode"
                                                                    value={customMode[user.id] ?? "add"}
                                                                    onChange={(e) => setCustomMode((p) => ({ ...p, [user.id]: e.target.value as any }))}
                                                                >
                                                                    <option value="add">Add</option>
                                                                    <option value="subtract">Subtract</option>
                                                                    <option value="set">Set to</option>
                                                                </select>
                                                                <div className="adminusers__custom-input-wrap">
                                                                    <span className="adminusers__custom-symbol">£</span>
                                                                    <input
                                                                        type="number"
                                                                        className="adminusers__custom-input"
                                                                        placeholder="0.00"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={customAmount[user.id] ?? ""}
                                                                        onChange={(e) => setCustomAmount((p) => ({ ...p, [user.id]: e.target.value }))}
                                                                        onKeyDown={(e) => e.key === "Enter" && handleCustomSubmit(user)}
                                                                    />
                                                                </div>
                                                                <button className="adminusers__custom-apply" onClick={() => handleCustomSubmit(user)} disabled={isPending}>Apply</button>
                                                            </div>
                                                            {error && <p className="adminusers__error" role="alert">{error}</p>}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="adminusers__count">Showing {filtered.length} of {users.length} clients</p>

            {/* ── Edit Modal ── */}
            {editUser && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="admin-modal-header">
                            <h2>Edit User</h2>
                            <button onClick={() => setEditUser(null)} className="admin-modal-close" aria-label="Close modal"><X size={16} /></button>
                        </div>
                        <div className="admin-modal-body">
                            {editError && <div className="adminusers__error">{editError}</div>}
                            <div className="admin-modal-field"><label>Full Name</label><input value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} /></div>
                            <div className="admin-modal-field"><label>Email</label><input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                            <div className="admin-modal-field"><label>National Insurance / Tax ID</label><input value={editForm.ssn} onChange={e => setEditForm({ ...editForm, ssn: e.target.value })} /></div>
                            <div className="admin-modal-field"><label>Avatar URL</label><input value={editForm.avatarUrl} onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })} /></div>
                        </div>
                        <div className="admin-modal-footer">
                            <button onClick={() => setEditUser(null)} className="admin-modal-btn">Cancel</button>
                            <button onClick={handleEditSubmit} className="admin-modal-btn admin-modal-btn--primary" disabled={isPending}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Suspend Modal ── */}
            {suspendUser && (
                <div className="admin-modal-overlay">
                    <div className={`admin-modal ${suspendUser.status === "SUSPENDED" ? "admin-modal--warning" : "admin-modal--danger"}`}>
                        <div className="admin-modal-header">
                            <h2>{suspendUser.status === "SUSPENDED" ? "Manage Suspension" : "Suspend User"}</h2>
                            <button onClick={() => setSuspendUser(null)} className="admin-modal-close" aria-label="Close modal"><X size={16} /></button>
                        </div>
                        <div className="admin-modal-body">
                            {suspendError && <div className="adminusers__error">{suspendError}</div>}
                            <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", textAlign: "left" }}>
                                User: <strong>{suspendUser.fullName}</strong>
                            </p>
                            {suspendUser.status === "SUSPENDED" ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", textAlign: "left" }}>
                                    <p style={{ margin: 0, color: "#f59e0b", fontSize: "var(--font-size-sm)", lineHeight: 1.5 }}>
                                        This account is currently suspended until {suspendUser.suspendedUntil ? new Date(suspendUser.suspendedUntil).toLocaleDateString("en-GB") : "indefinitely"}.
                                    </p>
                                    <button onClick={handleUnsuspend} className="admin-modal-btn admin-modal-btn--warning" disabled={isPending} style={{ width: "auto", alignSelf: "flex-start" }}>Lift Suspension</button>
                                </div>
                            ) : (
                                <div className="admin-modal-field">
                                    <label>Suspend for (days)</label>
                                    <input type="number" min="1" value={suspendDays} onChange={e => setSuspendDays(e.target.value)} />
                                </div>
                            )}
                        </div>
                        {suspendUser.status !== "SUSPENDED" && (
                            <div className="admin-modal-footer">
                                <button onClick={() => setSuspendUser(null)} className="admin-modal-btn">Cancel</button>
                                <button onClick={handleSuspendSubmit} className="admin-modal-btn admin-modal-btn--danger" disabled={isPending}>Suspend Account</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Delete Modal ── */}
            {deleteUser && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal admin-modal--danger">
                        <div className="admin-modal-header">
                            <h2>Delete User</h2>
                            <button onClick={() => setDeleteUser(null)} className="admin-modal-close" aria-label="Close modal"><X size={16} /></button>
                        </div>
                        <div className="admin-modal-body" style={{ gap: "var(--space-3)" }}>
                            {deleteError && <div className="adminusers__error">{deleteError}</div>}
                            <div style={{ display: "flex", gap: "12px", alignItems: "center", color: "#ef4444" }}>
                                <AlertCircle size={24} />
                                <strong style={{ fontSize: "var(--font-size-md)" }}>Warning: Irreversible Action</strong>
                            </div>
                            <p style={{ lineHeight: 1.6, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", margin: 0, textAlign: "left" }}>
                                Are you sure you want to permanently delete <strong>{deleteUser.fullName}</strong>? This will instantly remove their account, balances, loans, and all transaction history. This action cannot be undone.
                            </p>
                        </div>
                        <div className="admin-modal-footer">
                            <button onClick={() => setDeleteUser(null)} className="admin-modal-btn">Cancel</button>
                            <button onClick={handleDeleteSubmit} className="admin-modal-btn admin-modal-btn--danger" disabled={isPending}>Delete User</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}