"use client";

import { useState } from "react";
import {
    Landmark,
    Clock,
    CircleDot,
    BadgeCheck,
    XCircle,
    CheckCircle,
    AlertCircle,
    X,
    FileText,
    Percent,
    Calendar,
    Coins
} from "lucide-react";
import "@/styles/user/assets.scss";

function fmt(val: number | string, currency = "USD") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

function fmtDate(date: Date | string) {
    const d = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(d);
}

const LOAN_STATUS_META: Record<string, { label: string; cls: string; Icon: any; color: string }> = {
    PENDING: { label: "Pending", cls: "lstatus--pending", Icon: Clock, color: "var(--color-gold-400)" },
    UNDER_REVIEW: { label: "Under Review", cls: "lstatus--review", Icon: AlertCircle, color: "#38bdf8" },
    APPROVED: { label: "Approved", cls: "lstatus--approved", Icon: BadgeCheck, color: "#4ade80" },
    ACTIVE: { label: "Active", cls: "lstatus--active", Icon: CircleDot, color: "#4ade80" },
    REJECTED: { label: "Rejected", cls: "lstatus--rejected", Icon: XCircle, color: "#f87171" },
    CLOSED: { label: "Closed", cls: "lstatus--closed", Icon: CheckCircle, color: "var(--color-text-muted)" },
};

interface Loan {
    id: string;
    referenceId: string;
    type: string;
    status: string;
    principalAmount: any;
    currency: string;
    interestRate: any;
    termMonths: number;
    monthlyPayment: any;
    purpose: string;
    collateral: string | null;
    notes: string | null;
    createdAt: any;
}

interface AssetLoansListProps {
    loans: Loan[];
}

export function AssetLoansList({ loans }: AssetLoansListProps) {
    const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

    const handleOpenReceipt = (loan: Loan) => {
        setSelectedLoan(loan);
    };

    const handleCloseReceipt = () => {
        setSelectedLoan(null);
    };

    return (
        <>
            <ul className="assetspage__loan-list" role="list">
                {loans.map((loan) => {
                    const meta = LOAN_STATUS_META[loan.status] ?? LOAN_STATUS_META.PENDING;
                    const StatusIcon = meta.Icon;

                    return (
                        <li
                            key={loan.id}
                            className="assetspage__loan-item clickable"
                            onClick={() => handleOpenReceipt(loan)}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="assetspage__loan-icon">
                                <Landmark size={16} aria-hidden="true" />
                            </div>
                            <div className="assetspage__loan-info">
                                <span className="assetspage__loan-type">
                                    {loan.type.replace(/_/g, " ")} Loan
                                </span>
                                <span className="assetspage__loan-purpose">{loan.purpose}</span>
                                <span className="assetspage__loan-meta">
                                    {loan.termMonths} months
                                    &nbsp;·&nbsp;
                                    {Number(loan.interestRate).toFixed(2)}% p.a.
                                    &nbsp;·&nbsp;
                                    Applied {fmtDate(loan.createdAt)}
                                </span>
                            </div>
                            <div className="assetspage__loan-right">
                                <span className="assetspage__loan-amount">
                                    {fmt(loan.principalAmount, loan.currency)}
                                </span>
                                {loan.monthlyPayment && (
                                    <span className="assetspage__loan-monthly">
                                        {fmt(loan.monthlyPayment, loan.currency)}/mo
                                    </span>
                                )}
                                <span className={`assetspage__loan-badge ${meta.cls}`}>
                                    <StatusIcon size={10} aria-hidden="true" />
                                    {meta.label}
                                </span>
                            </div>
                        </li>
                    );
                })}
            </ul>

            {/* Premium Loan Agreement & Receipt Modal */}
            {selectedLoan && (() => {
                const meta = LOAN_STATUS_META[selectedLoan.status] ?? LOAN_STATUS_META.PENDING;
                const StatusIcon = meta.Icon;

                return (
                    <div className="tx-modal-overlay" onClick={handleCloseReceipt}>
                        <div className="tx-modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="tx-modal-header">
                                <div className="tx-modal-title">
                                    <FileText size={18} className="text-gold" />
                                    <span>Loan Facility Agreement</span>
                                </div>
                                <button className="tx-modal-close" onClick={handleCloseReceipt} aria-label="Close modal">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="tx-modal-receipt-body">
                                {/* Brand Header */}
                                <div className="receipt-brand">
                                    <div className="brand-logo">G</div>
                                    <p className="brand-name">GOLDEN PRIVATE WEALTH</p>
                                    <p className="brand-credit-label">Institutional Credit Registry</p>
                                </div>

                                {/* Main Approved Principal */}
                                <div className="receipt-amount-section">
                                    <div className="receipt-amount text-gold">
                                        {fmt(selectedLoan.principalAmount, selectedLoan.currency)}
                                    </div>
                                    <div className="receipt-status-badge" style={{ borderColor: meta.color, color: meta.color }}>
                                        <StatusIcon size={12} />
                                        <span>{meta.label}</span>
                                    </div>
                                </div>

                                {/* Loan details info */}
                                <div className="receipt-details">
                                    <div className="receipt-row">
                                        <span className="row-label">Loan Reference</span>
                                        <span className="row-value monospace">{selectedLoan.referenceId.toUpperCase()}</span>
                                    </div>

                                    <div className="receipt-row">
                                        <span className="row-label">Facility Type</span>
                                        <span className="row-value highlight">
                                            {selectedLoan.type.replace(/_/g, " ")} Loan
                                        </span>
                                    </div>

                                    <div className="receipt-row">
                                        <span className="row-label">Interest Rate</span>
                                        <span className="row-value">
                                            {Number(selectedLoan.interestRate).toFixed(2)}% p.a. (Fixed)
                                        </span>
                                    </div>

                                    <div className="receipt-row">
                                        <span className="row-label">Term Duration</span>
                                        <span className="row-value">{selectedLoan.termMonths} Months</span>
                                    </div>

                                    {selectedLoan.monthlyPayment && (
                                        <div className="receipt-row">
                                            <span className="row-label">Amortized Payment</span>
                                            <span className="row-value highlight">
                                                {fmt(selectedLoan.monthlyPayment, selectedLoan.currency)}/month
                                            </span>
                                        </div>
                                    )}

                                    <div className="receipt-row">
                                        <span className="row-label">Purpose of Funds</span>
                                        <span className="row-value">{selectedLoan.purpose}</span>
                                    </div>

                                    {selectedLoan.collateral && (
                                        <div className="receipt-row">
                                            <span className="row-label">Pledged Collateral</span>
                                            <span className="row-value">{selectedLoan.collateral}</span>
                                        </div>
                                    )}

                                    <div className="receipt-row">
                                        <span className="row-label font-mono">Origination Date</span>
                                        <span className="row-value">{fmtDate(selectedLoan.createdAt)}</span>
                                    </div>

                                    {selectedLoan.notes && (
                                        <div className="receipt-memo">
                                            <div className="memo-label">Agreement Terms & Covenants</div>
                                            <div className="memo-content">"{selectedLoan.notes}"</div>
                                        </div>
                                    )}
                                </div>

                                {/* Security footer stamp */}
                                <div className="receipt-footer-stamp">
                                    <p>Golden Vault Credit Protection and Underwriting Trust</p>
                                    <p className="timestamp-stamp">VERIFIED AT: {new Date().toISOString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </>
    );
}
