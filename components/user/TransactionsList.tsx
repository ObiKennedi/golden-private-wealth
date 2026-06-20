"use client";

import { useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    X,
    CheckCircle2,
    Clock,
    XCircle,
    FileText,
    Receipt
} from "lucide-react";
import "@/styles/user/transactions.scss";

// Replicate formatting from page
function fmt(val: number | string, currency = "GBP") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: currency === "USD" ? "GBP" : currency,
        minimumFractionDigits: 2,
    }).format(n);
}

function fmtDate(date: Date | string) {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-UK", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(d);
}

function fmtTime(date: Date | string) {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-UK", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(d);
}

const TX_ICON = {
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

interface Transaction {
    id: string;
    type: string;
    amount: any;
    currency: string;
    status: string;
    description: string | null;
    referenceId: string;
    note: string | null;
    createdAt: any;
    senderAccountId: string | null;
    receiverAccountId: string | null;
    senderAccount?: { accountNumber: string; type: string; ownerName?: string | null } | null;
    receiverAccount?: { accountNumber: string; type: string; ownerName?: string | null } | null;
}

interface TransactionsListProps {
    transactions: Transaction[];
    accountIds: string[];
}

export function TransactionsList({ transactions, accountIds }: TransactionsListProps) {
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

    // Group transactions by date label
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
        const key = fmtDate(tx.createdAt);
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
    });

    const handleOpenReceipt = (tx: Transaction) => {
        setSelectedTx(tx);
    };

    const handleCloseReceipt = () => {
        setSelectedTx(null);
    };

    return (
        <>
            <div className="txpage__groups">
                {Object.entries(groups).map(([date, groupTxs]) => (
                    <div key={date} className="txpage__group">
                        <p className="txpage__group-date">{date}</p>
                        <ul className="txpage__list" role="list">
                            {groupTxs.map((tx) => {
                                const Icon = (TX_ICON as any)[tx.type] ?? ArrowLeftRight;

                                // For transfers, determine direction from the user's perspective
                                const isReceivedTransfer =
                                    tx.type === "TRANSFER" &&
                                    tx.receiverAccountId !== null &&
                                    accountIds.includes(tx.receiverAccountId);
                                const isSentTransfer =
                                    tx.type === "TRANSFER" &&
                                    tx.senderAccountId !== null &&
                                    accountIds.includes(tx.senderAccountId);

                                const isCredit = CREDIT_TYPES.has(tx.type) || isReceivedTransfer;
                                const isDebit = isSentTransfer || (!CREDIT_TYPES.has(tx.type) && tx.type !== "TRANSFER");
                                const isNeutral = tx.type === "TRANSFER" && !isReceivedTransfer && !isSentTransfer;

                                // Pick icon — for transfers use direction-aware arrows
                                const TxIcon = tx.type === "TRANSFER"
                                    ? isReceivedTransfer ? ArrowDownLeft
                                        : isSentTransfer ? ArrowUpRight
                                            : ArrowLeftRight
                                    : ((TX_ICON as any)[tx.type] ?? ArrowLeftRight);

                                // For received transfers: show who sent it (senderAccount)
                                // For sent transfers: show who received it (receiverAccount)
                                const counterpartyAccount = isCredit ? tx.senderAccount : tx.receiverAccount;
                                const counterpartyName = counterpartyAccount?.ownerName ?? null;
                                const counterpartyAcctNum = counterpartyAccount?.accountNumber
                                    ? `•••• ${counterpartyAccount.accountNumber.slice(-4)}`
                                    : "External";
                                const acctLabel = counterpartyName
                                    ? `${isCredit ? "From" : "To"} ${counterpartyName}`
                                    : counterpartyAcctNum;

                                return (
                                    <li
                                        key={tx.id}
                                        className="txpage__item clickable"
                                        onClick={() => handleOpenReceipt(tx)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <div className={`txpage__item-icon ${isCredit ? "icon--credit" : isNeutral ? "icon--neutral" : "icon--debit"}`}>
                                            <TxIcon size={16} aria-hidden="true" />
                                        </div>

                                        <div className="txpage__item-body">
                                            <div className="txpage__item-top">
                                                <span className="txpage__item-desc">
                                                    {tx.description ?? tx.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                                </span>
                                                <span className={`txpage__item-amount ${isCredit ? "amount--credit" : isDebit ? "amount--debit" : "amount--neutral"}`}>
                                                    {isCredit ? "+" : isDebit ? "−" : ""}{fmt(tx.amount, tx.currency)}
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

            {/* Premium Transaction Receipt Modal */}
            {selectedTx && (() => {
                const isReceivedTransfer =
                    selectedTx.type === "TRANSFER" &&
                    selectedTx.receiverAccountId !== null &&
                    accountIds.includes(selectedTx.receiverAccountId);
                const isSentTransfer =
                    selectedTx.type === "TRANSFER" &&
                    selectedTx.senderAccountId !== null &&
                    accountIds.includes(selectedTx.senderAccountId);

                const isCredit = CREDIT_TYPES.has(selectedTx.type) || isReceivedTransfer;
                const isDebit = isSentTransfer || (!CREDIT_TYPES.has(selectedTx.type) && selectedTx.type !== "TRANSFER");

                const statusColor =
                    selectedTx.status === "COMPLETED" ? "#4ade80" :
                        selectedTx.status === "PENDING" ? "var(--color-gold-400)" :
                            "#f87171";

                const StatusIcon =
                    selectedTx.status === "COMPLETED" ? CheckCircle2 :
                        selectedTx.status === "PENDING" ? Clock :
                            XCircle;

                return (
                    <div className="tx-modal-overlay" onClick={handleCloseReceipt}>
                        <div className="tx-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="tx-modal-header">
                                <div className="tx-modal-title">
                                    <Receipt size={18} className="text-gold" />
                                    <span>Transaction Receipt</span>
                                </div>
                                <button className="tx-modal-close" onClick={handleCloseReceipt} aria-label="Close modal">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="tx-modal-receipt-body">
                                {/* Top Ring Logo Decoration */}
                                <div className="receipt-brand">
                                    <div className="brand-logo">G</div>
                                    <p className="brand-name">Golden Private Wealth</p>
                                </div>

                                {/* Main Amount Block */}
                                <div className="receipt-amount-section">
                                    <div className={`receipt-amount ${isCredit ? "text-success" : isDebit ? "text-danger" : ""}`}>
                                        {isCredit ? "+" : isDebit ? "−" : ""}{fmt(selectedTx.amount, selectedTx.currency)}
                                    </div>
                                    <div className="receipt-status-badge" style={{ borderColor: statusColor, color: statusColor }}>
                                        <StatusIcon size={12} />
                                        <span>{selectedTx.status}</span>
                                    </div>
                                </div>

                                {/* Receipt Details Grid */}
                                <div className="receipt-details">
                                    <div className="receipt-row">
                                        <span className="row-label">Description</span>
                                        <span className="row-value highlight">
                                            {selectedTx.description ?? selectedTx.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </span>
                                    </div>

                                    <div className="receipt-row">
                                        <span className="row-label">Transaction Type</span>
                                        <span className="row-value">{selectedTx.type.replace(/_/g, " ")}</span>
                                    </div>

                                    <div className="receipt-row">
                                        <span className="row-label">Reference ID</span>
                                        <span className="row-value monospace">{selectedTx.referenceId.toUpperCase()}</span>
                                    </div>

                                    <div className="receipt-row">
                                        <span className="row-label">Date & Time</span>
                                        <span className="row-value">
                                            {fmtDate(selectedTx.createdAt)} · {fmtTime(selectedTx.createdAt)}
                                        </span>
                                    </div>

                                    {/* Account information details */}
                                    {selectedTx.senderAccount && (
                                        <div className="receipt-row">
                                            <span className="row-label">From</span>
                                            <span className="row-value">
                                                {selectedTx.senderAccount.ownerName && (
                                                    <strong style={{ display: "block" }}>{selectedTx.senderAccount.ownerName}</strong>
                                                )}
                                                <span className="monospace">
                                                    {selectedTx.senderAccount.accountNumber} ({selectedTx.senderAccount.type})
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                    {selectedTx.receiverAccount && (
                                        <div className="receipt-row">
                                            <span className="row-label">To</span>
                                            <span className="row-value">
                                                {selectedTx.receiverAccount.ownerName && (
                                                    <strong style={{ display: "block" }}>{selectedTx.receiverAccount.ownerName}</strong>
                                                )}
                                                <span className="monospace">
                                                    {selectedTx.receiverAccount.accountNumber} ({selectedTx.receiverAccount.type})
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                    {selectedTx.note && (
                                        <div className="receipt-memo">
                                            <div className="memo-label">Memo / Note</div>
                                            <div className="memo-content">"{selectedTx.note}"</div>
                                        </div>
                                    )}
                                </div>

                                {/* Security Footer Stamp */}
                                <div className="receipt-footer-stamp">
                                    <p>Secured by Golden Private Wealth Cryptographic Audit Registry</p>
                                    <p className="timestamp-stamp">ISSUED: {new Date().toISOString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}
