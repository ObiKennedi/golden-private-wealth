"use client";

import { useState, useTransition } from "react";
import {
    Lock,
    Unlock,
    Clock,
    CheckCircle,
    ChevronDown,
    TrendingUp,
    Calendar,
    Percent,
    DollarSign,
    AlertCircle,
    Loader2,
    XCircle,
} from "lucide-react";
import { requestSavingsWithdrawalAction } from "@/actions/savings";

function fmt(val: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(val);
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(iso));
}

function daysRemaining(unlocksAt: string) {
    const diff = new Date(unlocksAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function progressPercent(lockedAt: string, unlocksAt: string) {
    const total = new Date(unlocksAt).getTime() - new Date(lockedAt).getTime();
    const elapsed = Date.now() - new Date(lockedAt).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

interface SavingsLockCardProps {
    lock: {
        id: string;
        referenceId: string;
        amount: number;
        currency: string;
        lockDays: number;
        interestRatePerDay: number;
        lockedAt: string;
        unlocksAt: string;
        status: "LOCKED" | "PENDING_WITHDRAWAL" | "COMPLETED" | "REJECTED";
        settledAt: string | null;
        totalInterestPaid: number | null;
    };
}

export function SavingsLockCard({ lock }: SavingsLockCardProps) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<{ success?: boolean; globalError?: string } | null>(null);
    const [isPending, startTransition] = useTransition();

    const isUnlocked = new Date() >= new Date(lock.unlocksAt);
    const daysLeft = daysRemaining(lock.unlocksAt);
    const progress = progressPercent(lock.lockedAt, lock.unlocksAt);
    const principal = lock.amount;
    const interest = +(principal * lock.lockDays * lock.interestRatePerDay).toFixed(2);
    const totalPayout = +(principal + interest).toFixed(2);

    function handleWithdraw() {
        startTransition(async () => {
            const fd = new FormData();
            fd.set("lockId", lock.id);
            const result = await requestSavingsWithdrawalAction(null, fd);
            setState(result as any);
        });
    }

    // ── Status badge config ───────────────────────────────────
    const STATUS = {
        LOCKED: {
            label: isUnlocked ? "Ready to Withdraw" : "Locked",
            cls: isUnlocked ? "savingspage__lock-status-badge--unlocked" : "savingspage__lock-status-badge--locked",
            Icon: isUnlocked ? Unlock : Lock,
        },
        PENDING_WITHDRAWAL: {
            label: "Awaiting Admin",
            cls: "savingspage__lock-status-badge--pending",
            Icon: Clock,
        },
        COMPLETED: {
            label: "Completed",
            cls: "savingspage__lock-status-badge--completed",
            Icon: CheckCircle,
        },
        REJECTED: {
            label: "Rejected",
            cls: "savingspage__lock-status-badge--rejected",
            Icon: XCircle,
        },
    };

    const meta = STATUS[lock.status];
    const StatusIcon = meta.Icon;

    return (
        <div
            className={`savingspage__lock-card ${
                isUnlocked && lock.status === "LOCKED" ? "savingspage__lock-card--unlocked" :
                lock.status === "PENDING_WITHDRAWAL" ? "savingspage__lock-card--pending" :
                lock.status === "COMPLETED" ? "savingspage__lock-card--completed" : ""
            }`}
        >
            {/* ── Collapsed Header ── */}
            <div className="savingspage__lock-card-header" onClick={() => setOpen(o => !o)}>
                <div className="savingspage__lock-card-left">
                    <div className={`savingspage__lock-icon ${
                        lock.status === "PENDING_WITHDRAWAL" ? "savingspage__lock-icon--pending" :
                        lock.status === "COMPLETED" ? "savingspage__lock-icon--completed" : ""
                    }`}>
                        <StatusIcon size={18} />
                    </div>
                    <div>
                        <div className="savingspage__lock-amount">{fmt(principal, lock.currency)}</div>
                        <div className="savingspage__lock-meta">
                            {lock.lockDays} day lock · Matures {fmtDate(lock.unlocksAt)}
                        </div>
                    </div>
                </div>

                <div className="savingspage__lock-badges">
                    <span className={`savingspage__lock-status-badge ${meta.cls}`}>
                        <StatusIcon size={10} />
                        {meta.label}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`savingspage__lock-chevron ${open ? "savingspage__lock-chevron--open" : ""}`}
                    />
                </div>
            </div>

            {/* ── Expanded Details ── */}
            {open && (
                <div className="savingspage__lock-details">
                    {/* Detail Grid */}
                    <div className="savingspage__lock-detail-grid">
                        <div className="savingspage__lock-detail-item">
                            <span className="savingspage__lock-detail-label">
                                <DollarSign size={10} style={{ display: "inline" }} /> Principal
                            </span>
                            <span className="savingspage__lock-detail-value">
                                {fmt(principal, lock.currency)}
                            </span>
                        </div>
                        <div className="savingspage__lock-detail-item">
                            <span className="savingspage__lock-detail-label">
                                <Percent size={10} style={{ display: "inline" }} /> Daily Rate
                            </span>
                            <span className="savingspage__lock-detail-value savingspage__lock-detail-value--green">
                                1.00% / day
                            </span>
                        </div>
                        <div className="savingspage__lock-detail-item">
                            <span className="savingspage__lock-detail-label">
                                <Calendar size={10} style={{ display: "inline" }} /> Lock Period
                            </span>
                            <span className="savingspage__lock-detail-value">
                                {lock.lockDays} days
                            </span>
                        </div>
                        <div className="savingspage__lock-detail-item">
                            <span className="savingspage__lock-detail-label">
                                <TrendingUp size={10} style={{ display: "inline" }} /> Interest Earned
                            </span>
                            <span className="savingspage__lock-detail-value savingspage__lock-detail-value--green">
                                {lock.status === "COMPLETED" && lock.totalInterestPaid !== null
                                    ? fmt(lock.totalInterestPaid, lock.currency)
                                    : fmt(interest, lock.currency)}
                            </span>
                        </div>
                        <div className="savingspage__lock-detail-item">
                            <span className="savingspage__lock-detail-label">
                                <Calendar size={10} style={{ display: "inline" }} /> Locked On
                            </span>
                            <span className="savingspage__lock-detail-value">
                                {fmtDate(lock.lockedAt)}
                            </span>
                        </div>
                        <div className="savingspage__lock-detail-item">
                            <span className="savingspage__lock-detail-label">
                                <Unlock size={10} style={{ display: "inline" }} /> Matures On
                            </span>
                            <span className={`savingspage__lock-detail-value ${isUnlocked ? "savingspage__lock-detail-value--blue" : ""}`}>
                                {fmtDate(lock.unlocksAt)}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar (only for active locks) */}
                    {lock.status === "LOCKED" && (
                        <div className="savingspage__lock-progress">
                            <div className="savingspage__lock-progress-label">
                                <span>Lock Progress</span>
                                <span>{isUnlocked ? "Matured" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}</span>
                            </div>
                            <div className="savingspage__lock-progress-bar">
                                <span style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    )}

                    {/* Total Payout Row */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "var(--space-3) var(--space-4)",
                        background: "rgba(52, 211, 153, 0.06)",
                        border: "1px solid rgba(52, 211, 153, 0.18)",
                        borderRadius: "var(--radius-lg)",
                    }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                            Total Payout at Maturity
                        </span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-md)", fontWeight: 600, color: "#34d399" }}>
                            {lock.status === "COMPLETED" && lock.totalInterestPaid !== null
                                ? fmt(principal + lock.totalInterestPaid, lock.currency)
                                : fmt(totalPayout, lock.currency)}
                        </span>
                    </div>

                    {/* Ref */}
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", letterSpacing: "var(--letter-spacing-wide)" }}>
                        Ref: {lock.referenceId.slice(0, 16).toUpperCase()}
                    </div>

                    {/* ── Actions ── */}
                    {lock.status === "LOCKED" && isUnlocked && (
                        <div className="savingspage__lock-actions">
                            {state?.globalError && (
                                <div className="savingspage__error-notice">
                                    <AlertCircle size={14} /> {state.globalError}
                                </div>
                            )}
                            {state?.success ? (
                                <div className="savingspage__success-result">
                                    <CheckCircle size={14} />
                                    Withdrawal request submitted. Awaiting admin approval.
                                </div>
                            ) : (
                                <button
                                    className="savingspage__withdraw-btn"
                                    onClick={handleWithdraw}
                                    disabled={isPending}
                                >
                                    {isPending ? <Loader2 size={14} className="spin" /> : <Unlock size={14} />}
                                    {isPending ? "Submitting…" : `Request Withdrawal — ${fmt(totalPayout, lock.currency)}`}
                                </button>
                            )}
                        </div>
                    )}

                    {lock.status === "PENDING_WITHDRAWAL" && (
                        <div className="savingspage__pending-notice">
                            <Clock size={14} style={{ flexShrink: 0 }} />
                            Your withdrawal request of {fmt(totalPayout, lock.currency)} is awaiting admin approval. You will receive the funds in your checking account once approved.
                        </div>
                    )}

                    {lock.status === "COMPLETED" && lock.settledAt && (
                        <div className="savingspage__success-notice">
                            <CheckCircle size={14} />
                            Settled on {fmtDate(lock.settledAt)} — funds credited to your checking account.
                        </div>
                    )}

                    {lock.status === "REJECTED" && isUnlocked && (
                        <div className="savingspage__lock-actions">
                            <div className="savingspage__error-notice">
                                <XCircle size={14} />
                                Your previous withdrawal request was rejected. You may submit a new request.
                            </div>
                            <button
                                className="savingspage__withdraw-btn"
                                onClick={handleWithdraw}
                                disabled={isPending}
                            >
                                {isPending ? <Loader2 size={14} className="spin" /> : <Unlock size={14} />}
                                {isPending ? "Submitting…" : `Re-request Withdrawal — ${fmt(totalPayout, lock.currency)}`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
