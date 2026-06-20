"use client";

import { useState, useActionState } from "react";
import {
    PiggyBank, Lock, ArrowRight, TrendingUp, Wallet, Loader2,
    CheckCircle, AlertCircle, ArrowLeftRight, ArrowDownLeft, ArrowUpRight,
    Receipt, X, CheckCircle2, Clock, XCircle, History,
} from "lucide-react";
import { lockSavingsAction } from "@/actions/savings";
import { SavingsLockCard } from "@/components/user/SavingsLockCard";
import "@/styles/user/savings.scss";

// ── Constants ──────────────────────────────────────────────────────────────

const LOCK_OPTIONS = [
    { days: 7,  label: "7 Days",  rate: 0.01 },
    { days: 14, label: "14 Days", rate: 0.01 },
    { days: 30, label: "30 Days", rate: 0.01 },
    { days: 60, label: "60 Days", rate: 0.01 },
    { days: 90, label: "90 Days", rate: 0.01 },
];

const CREDIT_TYPES = new Set(["DEPOSIT", "YIELD_PAYOUT", "ASSET_SALE"]);

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(val: number, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency === "USD" ? "GBP" : currency, minimumFractionDigits: 2 }).format(val);
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}

function fmtTime(iso: string) {
    return new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
}

// ── Types ──────────────────────────────────────────────────────────────────

interface SavingsLock {
    id: string; referenceId: string; amount: number; currency: string;
    lockDays: number; interestRatePerDay: number; lockedAt: string; unlocksAt: string;
    status: "LOCKED" | "PENDING_WITHDRAWAL" | "COMPLETED" | "REJECTED";
    settledAt: string | null; totalInterestPaid: number | null;
}

interface SavingsTx {
    id: string; referenceId: string; type: string; status: string;
    amount: number; currency: string; description: string | null;
    createdAt: string; senderAccountId: string | null; receiverAccountId: string | null;
    senderAccount:   { accountNumber: string; type: string } | null;
    receiverAccount: { accountNumber: string; type: string } | null;
}

interface SavingsClientProps {
    savingsAccountId:  string;
    checkingAccountId: string;
    savingsBalance:    number;
    checkingBalance:   number;
    currency:          string;
    activeLocks:       SavingsLock[];
    completedLocks:    SavingsLock[];
    savingsTransactions: SavingsTx[];
}

// ── Receipt Modal ──────────────────────────────────────────────────────────

function ReceiptModal({
    tx, savingsAccountId, onClose,
}: { tx: SavingsTx; savingsAccountId: string; onClose: () => void }) {
    const isReceived = tx.receiverAccountId === savingsAccountId;
    const isSent     = tx.senderAccountId   === savingsAccountId;
    const isCredit   = CREDIT_TYPES.has(tx.type) || isReceived;
    const isDebit    = isSent && !CREDIT_TYPES.has(tx.type);

    const statusColor =
        tx.status === "COMPLETED" ? "#4ade80" :
        tx.status === "PENDING"   ? "var(--color-gold-400)" : "#f87171";

    const StatusIcon =
        tx.status === "COMPLETED" ? CheckCircle2 :
        tx.status === "PENDING"   ? Clock : XCircle;

    return (
        <div className="tx-modal-overlay" onClick={onClose}>
            <div className="tx-modal-content" onClick={e => e.stopPropagation()}>
                <div className="tx-modal-header">
                    <div className="tx-modal-title">
                        <Receipt size={18} className="text-gold" />
                        <span>Savings Receipt</span>
                    </div>
                    <button className="tx-modal-close" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="tx-modal-receipt-body">
                    <div className="receipt-brand">
                        <div className="brand-logo">G</div>
                        <p className="brand-name">Golden Private Wealth</p>
                    </div>

                    <div className="receipt-amount-section">
                        <div className={`receipt-amount ${isCredit ? "text-success" : isDebit ? "text-danger" : ""}`}>
                            {isCredit ? "+" : isDebit ? "−" : ""}{fmt(tx.amount, tx.currency)}
                        </div>
                        <div className="receipt-status-badge" style={{ borderColor: statusColor, color: statusColor }}>
                            <StatusIcon size={12} />
                            <span>{tx.status}</span>
                        </div>
                    </div>

                    <div className="receipt-details">
                        <div className="receipt-row">
                            <span className="row-label">Description</span>
                            <span className="row-value highlight">
                                {tx.description ?? tx.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                        </div>
                        <div className="receipt-row">
                            <span className="row-label">Transaction Type</span>
                            <span className="row-value">{tx.type.replace(/_/g, " ")}</span>
                        </div>
                        <div className="receipt-row">
                            <span className="row-label">Reference ID</span>
                            <span className="row-value monospace">{tx.referenceId.toUpperCase()}</span>
                        </div>
                        <div className="receipt-row">
                            <span className="row-label">Date &amp; Time</span>
                            <span className="row-value">{fmtDate(tx.createdAt)} · {fmtTime(tx.createdAt)}</span>
                        </div>
                        {tx.senderAccount && (
                            <div className="receipt-row">
                                <span className="row-label">From Account</span>
                                <span className="row-value monospace">
                                    {tx.senderAccount.accountNumber} ({tx.senderAccount.type})
                                </span>
                            </div>
                        )}
                        {tx.receiverAccount && (
                            <div className="receipt-row">
                                <span className="row-label">To Account</span>
                                <span className="row-value monospace">
                                    {tx.receiverAccount.accountNumber} ({tx.receiverAccount.type})
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="receipt-footer-stamp">
                        <p>Secured by Golden Private Wealth Cryptographic Audit Registry</p>
                        <p className="timestamp-stamp">ISSUED: {new Date().toISOString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function SavingsClient({
    savingsAccountId, checkingAccountId, savingsBalance, checkingBalance,
    currency, activeLocks, completedLocks, savingsTransactions,
}: SavingsClientProps) {
    const [lockState, lockAction, lockPending] = useActionState(lockSavingsAction, null);
    const [amount, setAmount]       = useState("");
    const [lockDays, setLockDays]   = useState(30);
    const [selectedTx, setSelectedTx] = useState<SavingsTx | null>(null);

    const parsedAmount   = parseFloat(amount) || 0;
    const interest       = +(parsedAmount * lockDays * 0.01).toFixed(2);
    const totalPayout    = +(parsedAmount + interest).toFixed(2);
    const showProjection = parsedAmount > 0;
    const activeCount    = activeLocks.filter(l => l.status !== "COMPLETED").length;

    // Group savings transactions by date
    const txGroups: Record<string, SavingsTx[]> = {};
    savingsTransactions.forEach(tx => {
        const key = fmtDate(tx.createdAt);
        if (!txGroups[key]) txGroups[key] = [];
        txGroups[key].push(tx);
    });

    return (
        <div className="savingspage">
            {/* ── Header ── */}
            <header className="savingspage__header">
                <div>
                    <p className="savingspage__pretitle">Vault Management</p>
                    <h1 className="savingspage__title">Savings Vault</h1>
                </div>
                <span className="savingspage__rate-badge">
                    <TrendingUp size={12} />
                    1% Interest Per Day · Simple Rate
                </span>
            </header>

            {/* ── Balance Summary ── */}
            <div className="savingspage__balances">
                <div className="savingspage__balance-card">
                    <span className="savingspage__balance-label">Savings Balance</span>
                    <span className="savingspage__balance-amount">{fmt(savingsBalance, currency)}</span>
                    <span className="savingspage__balance-sub">
                        {activeCount} active lock{activeCount !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="savingspage__balance-card savingspage__balance-card--checking">
                    <span className="savingspage__balance-label">Checking Balance</span>
                    <span className="savingspage__balance-amount">{fmt(checkingBalance, currency)}</span>
                    <span className="savingspage__balance-sub">Available to lock</span>
                </div>
            </div>

            {/* ── Lock New Savings ── */}
            <section className="savingspage__section">
                <h2 className="savingspage__section-title">Lock New Savings</h2>
                <div className="savingspage__lock-form">
                    <div className="savingspage__lock-form-header">
                        <div className="savingspage__lock-form-icon"><Lock size={18} /></div>
                        <h2>Create Savings Lock</h2>
                    </div>

                    <form action={lockAction}>
                        <input type="hidden" name="savingsAccountId"  value={savingsAccountId}  />
                        <input type="hidden" name="checkingAccountId" value={checkingAccountId} />
                        <input type="hidden" name="lockDays"          value={lockDays}           />

                        <div className="savingspage__lock-form-body">
                            {lockState?.globalError && (
                                <div className="savingspage__error-notice">
                                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                    {lockState.globalError}
                                </div>
                            )}
                            {lockState?.success && (
                                <div className="savingspage__success-result" style={{ color:"#34d399" }}>
                                    <CheckCircle size={14} />
                                    Savings locked successfully! Funds will be available at maturity.
                                </div>
                            )}

                            <div className="savingspage__form-row">
                                <div className="savingspage__field">
                                    <label>Amount to Lock ({currency})</label>
                                    <input
                                        type="number" name="amount" placeholder="0.00"
                                        min="1" step="0.01" value={amount}
                                        onChange={e => setAmount(e.target.value)} required
                                    />
                                </div>
                                <div className="savingspage__field">
                                    <label>Lock Duration</label>
                                    <select value={lockDays} onChange={e => setLockDays(Number(e.target.value))}>
                                        {LOCK_OPTIONS.map(opt => (
                                            <option key={opt.days} value={opt.days}>
                                                {opt.label} — {(opt.rate * opt.days * 100).toFixed(0)}% total return
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {showProjection && (
                                <div className="savingspage__projection">
                                    <div className="savingspage__projection-title">
                                        <TrendingUp size={12} /> Return Projection
                                    </div>
                                    <div className="savingspage__projection-row">
                                        <span>Principal</span><span>{fmt(parsedAmount, currency)}</span>
                                    </div>
                                    <div className="savingspage__projection-row">
                                        <span>Daily Rate</span><span>1.00% × {lockDays} days</span>
                                    </div>
                                    <div className="savingspage__projection-row">
                                        <span>Total Interest</span><span>+{fmt(interest, currency)}</span>
                                    </div>
                                    <div className="savingspage__projection-row savingspage__projection-row--total">
                                        <span>Total at Maturity</span><span>{fmt(totalPayout, currency)}</span>
                                    </div>
                                </div>
                            )}

                            <div style={{ display:"flex", alignItems:"flex-start", gap:"var(--space-2)", fontSize:"var(--font-size-xs)", color:"var(--color-text-muted)", fontFamily:"var(--font-body)", lineHeight:"var(--line-height-relaxed)" }}>
                                <Lock size={12} style={{ flexShrink:0, marginTop:2 }} />
                                Funds will be locked from your checking account and inaccessible until the maturity date. Interest is calculated at 1% of principal per day (simple rate).
                            </div>
                        </div>

                        <div className="savingspage__lock-form-footer">
                            <button
                                type="submit" className="savingspage__submit-btn"
                                disabled={lockPending || !parsedAmount || parsedAmount > checkingBalance}
                            >
                                {lockPending ? (
                                    <><Loader2 size={14} className="spin" /> Locking…</>
                                ) : (
                                    <><Lock size={14} /> Lock {parsedAmount > 0 ? fmt(parsedAmount, currency) : "Savings"}</>
                                )}
                            </button>
                            {parsedAmount > checkingBalance && parsedAmount > 0 && (
                                <p style={{ marginTop:"var(--space-2)", fontSize:"var(--font-size-xs)", color:"#ef4444", fontFamily:"var(--font-body)", textAlign:"center" }}>
                                    Amount exceeds your checking balance.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </section>

            {/* ── Move to Checking note ── */}
            <section className="savingspage__section">
                <h2 className="savingspage__section-title">Move to Checking</h2>
                <div className="savingspage__transfer-card">
                    <div className="savingspage__transfer-header">
                        <div className="savingspage__transfer-icon"><ArrowLeftRight size={18} /></div>
                        <h2>Savings Withdrawal</h2>
                    </div>
                    <div className="savingspage__transfer-body">
                        <div style={{ fontFamily:"var(--font-body)", fontSize:"var(--font-size-sm)", color:"var(--color-text-secondary)", lineHeight:"var(--line-height-relaxed)" }}>
                            To move funds from your savings vault back to checking, you must wait for a savings lock to mature. Once matured, expand the lock card below and click <strong>"Request Withdrawal"</strong>.
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:"var(--space-3)" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", fontSize:"var(--font-size-xs)", color:"var(--color-text-muted)", fontFamily:"var(--font-body)" }}>
                                <Lock size={11} /> Lock matures
                            </div>
                            <ArrowRight size={12} style={{ color:"var(--color-text-muted)" }} />
                            <div style={{ display:"flex", alignItems:"center", gap:"var(--space-2)", fontSize:"var(--font-size-xs)", color:"var(--color-text-muted)", fontFamily:"var(--font-body)" }}>
                                <Wallet size={11} /> Request withdrawal
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Active Locks ── */}
            <section className="savingspage__section">
                <h2 className="savingspage__section-title">Active Locks</h2>
                {activeLocks.length === 0 ? (
                    <div className="savingspage__empty">
                        <PiggyBank size={28} aria-hidden="true" />
                        <p>No active locks. Lock savings above to start earning interest.</p>
                    </div>
                ) : (
                    <div className="savingspage__locks-grid">
                        {activeLocks.map(lock => <SavingsLockCard key={lock.id} lock={lock} />)}
                    </div>
                )}
            </section>

            {/* ── Completed Locks ── */}
            {completedLocks.length > 0 && (
                <section className="savingspage__section">
                    <h2 className="savingspage__section-title">History</h2>
                    <div className="savingspage__locks-grid">
                        {completedLocks.map(lock => <SavingsLockCard key={lock.id} lock={lock} />)}
                    </div>
                </section>
            )}

            {/* ── Transaction History ── */}
            <section className="savingspage__section">
                <h2 className="savingspage__section-title" style={{ display:"flex", alignItems:"center", gap:"var(--space-2)" }}>
                    <History size={16} />
                    Transaction History
                </h2>

                {savingsTransactions.length === 0 ? (
                    <div className="savingspage__empty">
                        <ArrowLeftRight size={28} aria-hidden="true" />
                        <p>No savings transactions yet.</p>
                    </div>
                ) : (
                    <div className="savingspage__tx-history">
                        {Object.entries(txGroups).map(([date, txs]) => (
                            <div key={date} className="savingspage__tx-group">
                                <p className="savingspage__tx-date">{date}</p>
                                <ul className="savingspage__tx-list" role="list">
                                    {txs.map(tx => {
                                        const isReceived = tx.receiverAccountId === savingsAccountId;
                                        const isSent     = tx.senderAccountId   === savingsAccountId;
                                        const isCredit   = CREDIT_TYPES.has(tx.type) || isReceived;
                                        const isDebit    = isSent && !CREDIT_TYPES.has(tx.type);

                                        const TxIcon =
                                            tx.type === "TRANSFER"
                                                ? isReceived ? ArrowDownLeft : isSent ? ArrowUpRight : ArrowLeftRight
                                                : CREDIT_TYPES.has(tx.type) ? ArrowDownLeft : ArrowUpRight;

                                        const acctLabel = isCredit
                                            ? tx.senderAccount?.accountNumber
                                                ? `•••• ${tx.senderAccount.accountNumber.slice(-4)}`
                                                : "External"
                                            : tx.receiverAccount?.accountNumber
                                                ? `•••• ${tx.receiverAccount.accountNumber.slice(-4)}`
                                                : "External";

                                        return (
                                            <li
                                                key={tx.id}
                                                className="savingspage__tx-item"
                                                onClick={() => setSelectedTx(tx)}
                                                style={{ cursor:"pointer" }}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={e => e.key === "Enter" && setSelectedTx(tx)}
                                            >
                                                <div className={`savingspage__tx-icon ${isCredit ? "icon--credit" : isDebit ? "icon--debit" : "icon--neutral"}`}>
                                                    <TxIcon size={14} aria-hidden="true" />
                                                </div>
                                                <div className="savingspage__tx-body">
                                                    <div className="savingspage__tx-top">
                                                        <span className="savingspage__tx-desc">
                                                            {tx.description ?? tx.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                                        </span>
                                                        <span className={`savingspage__tx-amount ${isCredit ? "amount--credit" : isDebit ? "amount--debit" : "amount--neutral"}`}>
                                                            {isCredit ? "+" : isDebit ? "−" : ""}{fmt(tx.amount, tx.currency)}
                                                        </span>
                                                    </div>
                                                    <div className="savingspage__tx-bottom">
                                                        <span className="savingspage__tx-meta">
                                                            {acctLabel} · {fmtTime(tx.createdAt)}
                                                        </span>
                                                        <span className="savingspage__tx-ref">
                                                            Ref: {tx.referenceId.slice(0, 12).toUpperCase()}
                                                        </span>
                                                        <span className={`savingspage__tx-badge ${
                                                            tx.status === "COMPLETED" ? "badge--success" :
                                                            tx.status === "PENDING"   ? "badge--pending"  : "badge--error"
                                                        }`}>
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
            </section>

            {/* ── Receipt Modal ── */}
            {selectedTx && (
                <ReceiptModal
                    tx={selectedTx}
                    savingsAccountId={savingsAccountId}
                    onClose={() => setSelectedTx(null)}
                />
            )}
        </div>
    );
}
