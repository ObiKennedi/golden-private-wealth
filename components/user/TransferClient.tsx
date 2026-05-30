"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Send, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { submitTransferAction } from "@/actions/transfer"

// ── Bank list ─────────────────────────────────────────────────
const BANKS = [
    // ── Major US Banks ──
    { group: "US Commercial Banks", value: "JPMORGAN_CHASE", label: "JPMorgan Chase" },
    { group: "US Commercial Banks", value: "BANK_OF_AMERICA", label: "Bank of America" },
    { group: "US Commercial Banks", value: "WELLS_FARGO", label: "Wells Fargo" },
    { group: "US Commercial Banks", value: "CITIBANK", label: "Citibank" },
    { group: "US Commercial Banks", value: "US_BANK", label: "U.S. Bank" },
    { group: "US Commercial Banks", value: "PNC_BANK", label: "PNC Bank" },
    { group: "US Commercial Banks", value: "TRUIST", label: "Truist Bank" },
    { group: "US Commercial Banks", value: "GOLDMAN_SACHS", label: "Goldman Sachs" },
    { group: "US Commercial Banks", value: "MORGAN_STANLEY", label: "Morgan Stanley" },
    { group: "US Commercial Banks", value: "TD_BANK", label: "TD Bank" },
    { group: "US Commercial Banks", value: "CAPITAL_ONE", label: "Capital One" },
    { group: "US Commercial Banks", value: "CITIZENS_BANK", label: "Citizens Bank" },
    { group: "US Commercial Banks", value: "FIFTH_THIRD", label: "Fifth Third Bank" },
    { group: "US Commercial Banks", value: "REGIONS_BANK", label: "Regions Bank" },
    { group: "US Commercial Banks", value: "HUNTINGTON", label: "Huntington Bank" },
    { group: "US Commercial Banks", value: "ALLY_BANK", label: "Ally Bank" },
    { group: "US Commercial Banks", value: "FIRST_REPUBLIC", label: "First Republic Bank" },
    { group: "US Commercial Banks", value: "SILICON_VALLEY_BANK", label: "Silicon Valley Bank" },
    { group: "US Commercial Banks", value: "COMERICA", label: "Comerica Bank" },
    { group: "US Commercial Banks", value: "FLAGSTAR", label: "Flagstar Bank" },
    // ── US Credit Unions ──
    { group: "US Credit Unions", value: "NAVY_FEDERAL", label: "Navy Federal Credit Union" },
    { group: "US Credit Unions", value: "PENFED", label: "PenFed Credit Union" },
    { group: "US Credit Unions", value: "BECU", label: "BECU" },
    { group: "US Credit Unions", value: "SCHOOLS_FIRST", label: "SchoolsFirst FCU" },
    // ── US Fintech / Neo-banks ──
    { group: "US Fintech & Neo-banks", value: "CHIME", label: "Chime" },
    { group: "US Fintech & Neo-banks", value: "SOFI", label: "SoFi" },
    { group: "US Fintech & Neo-banks", value: "CURRENT", label: "Current" },
    { group: "US Fintech & Neo-banks", value: "VARO", label: "Varo Bank" },
    { group: "US Fintech & Neo-banks", value: "DAVE", label: "Dave" },
    { group: "US Fintech & Neo-banks", value: "CASH_APP", label: "Cash App (Sutton Bank)" },
    { group: "US Fintech & Neo-banks", value: "MERCURY", label: "Mercury" },
    { group: "US Fintech & Neo-banks", value: "BREX", label: "Brex" },
    { group: "US Fintech & Neo-banks", value: "RELAY", label: "Relay" },
    // ── International Banks ──
    { group: "International Banks", value: "HSBC", label: "HSBC" },
    { group: "International Banks", value: "BARCLAYS", label: "Barclays" },
    { group: "International Banks", value: "DEUTSCHE_BANK", label: "Deutsche Bank" },
    { group: "International Banks", value: "BNP_PARIBAS", label: "BNP Paribas" },
    { group: "International Banks", value: "CREDIT_SUISSE", label: "Credit Suisse" },
    { group: "International Banks", value: "UBS", label: "UBS" },
    { group: "International Banks", value: "STANDARD_CHARTERED", label: "Standard Chartered" },
    { group: "International Banks", value: "SOCIETE_GENERALE", label: "Société Générale" },
    { group: "International Banks", value: "ING", label: "ING Bank" },
    { group: "International Banks", value: "SANTANDER", label: "Santander" },
    { group: "International Banks", value: "LLOYDS", label: "Lloyds Bank" },
    { group: "International Banks", value: "RBC", label: "Royal Bank of Canada" },
    { group: "International Banks", value: "SCOTIABANK", label: "Scotiabank" },
    { group: "International Banks", value: "ANZ", label: "ANZ Bank" },
    { group: "International Banks", value: "NAB", label: "National Australia Bank" },
    { group: "International Banks", value: "WESTPAC", label: "Westpac" },
    { group: "International Banks", value: "DBS", label: "DBS Bank" },
    { group: "International Banks", value: "MIZUHO", label: "Mizuho Bank" },
    { group: "International Banks", value: "MUFG", label: "MUFG Bank" },
    { group: "International Banks", value: "ICBC", label: "ICBC" },
    // ── Global Fintech ──
    { group: "Global Fintech", value: "REVOLUT", label: "Revolut" },
    { group: "Global Fintech", value: "WISE", label: "Wise (TransferWise)" },
    { group: "Global Fintech", value: "N26", label: "N26" },
    { group: "Global Fintech", value: "MONZO", label: "Monzo" },
    { group: "Global Fintech", value: "STARLING", label: "Starling Bank" },
    { group: "Global Fintech", value: "NUBANK", label: "Nubank" },
    { group: "Global Fintech", value: "BUNQ", label: "bunq" },
    { group: "Global Fintech", value: "KLARNA", label: "Klarna" },
    { group: "Global Fintech", value: "PAYONEER", label: "Payoneer" },
    { group: "Global Fintech", value: "AIRWALLEX", label: "Airwallex" },
    { group: "Global Fintech", value: "STRIPE", label: "Stripe Treasury" },
]

const CURRENCIES = [
    { value: "USD", label: "USD — US Dollar" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "GBP", label: "GBP — British Pound" },
    { value: "CAD", label: "CAD — Canadian Dollar" },
    { value: "AUD", label: "AUD — Australian Dollar" },
    { value: "CHF", label: "CHF — Swiss Franc" },
    { value: "JPY", label: "JPY — Japanese Yen" },
    { value: "SGD", label: "SGD — Singapore Dollar" },
    { value: "HKD", label: "HKD — Hong Kong Dollar" },
]

const STATUS_META: Record<string, { cls: string; Icon: typeof Clock; label: string }> = {
    PENDING: { cls: "status--pending", Icon: Clock, label: "Pending" },
    PROCESSING: { cls: "status--review", Icon: AlertCircle, label: "Processing" },
    COMPLETED: { cls: "status--approved", Icon: CheckCircle, label: "Completed" },
    FAILED: { cls: "status--rejected", Icon: XCircle, label: "Failed" },
}

function fmt(amount: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency", currency, minimumFractionDigits: 2,
    }).format(amount)
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso))
}

interface Transfer {
    id: string
    recipientName: string
    recipientBank: string
    amount: number
    currency: string
    status: string
    reference: string
    createdAt: string
}

interface Props {
    userId: string
    accountNumber: string
    fullName: string
    recentTransfers: Transfer[]
}

export default function TransferClient({ userId, accountNumber, fullName, recentTransfers }: Props) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [fields, setFields] = useState({
        recipientName: "",
        recipientAccountNumber: "",
        recipientBank: "",
        amount: "",
        currency: "USD",
        note: "",
    })
    const [errors, setErrors] = useState<Partial<Record<keyof typeof fields, string>>>({})
    const [globalError, setGlobalError] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFields((p) => ({ ...p, [name]: value }))
        if (errors[name as keyof typeof fields]) {
            setErrors((p) => ({ ...p, [name]: undefined }))
        }
    }

    const validate = () => {
        const e: Partial<Record<keyof typeof fields, string>> = {}
        if (!fields.recipientName.trim()) e.recipientName = "Recipient name is required."
        if (!fields.recipientAccountNumber.trim()) e.recipientAccountNumber = "Account number is required."
        if (!fields.recipientBank) e.recipientBank = "Please select a destination bank."
        const amt = parseFloat(fields.amount)
        if (!fields.amount || isNaN(amt)) e.amount = "Enter a valid amount."
        else if (amt < 1) e.amount = "Minimum transfer is $1.00."
        else if (amt > 10_000_000) e.amount = "Maximum single transfer is $10,000,000."
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        setGlobalError(null)

        startTransition(async () => {
            const fd = new FormData()
            Object.entries(fields).forEach(([k, v]) => fd.append(k, v))
            fd.append("userId", userId)

            const result = await submitTransferAction(null, fd)
            if (result?.globalError) {
                setGlobalError(result.globalError)
                return
            }
            // Success — go to loader
            router.push("/dashboard/processing")
        })
    }

    // Group banks by category
    const groups = BANKS.reduce<Record<string, typeof BANKS>>((acc, b) => {
        if (!acc[b.group]) acc[b.group] = []
        acc[b.group].push(b)
        return acc
    }, {})

    return (
        <div className="transfer">

            {/* ── Header ── */}
            <header className="transfer__header">
                <div>
                    <p className="transfer__pretitle">Fund Movement</p>
                    <h1 className="transfer__title">Wire Transfer</h1>
                </div>
                <div className="transfer__from-badge">
                    <span className="transfer__from-label">From Account</span>
                    <span className="transfer__from-number">{accountNumber}</span>
                </div>
            </header>

            <div className="transfer__body">

                {/* ── Form ── */}
                <form className="transfer__form" onSubmit={handleSubmit} noValidate>

                    {globalError && (
                        <div className="transfer__alert" role="alert">
                            <AlertCircle size={14} aria-hidden />
                            <p>{globalError}</p>
                        </div>
                    )}

                    {/* Recipient section */}
                    <fieldset className="transfer__fieldset">
                        <legend className="transfer__legend">Recipient Details</legend>

                        <div className="transfer__field">
                            <label htmlFor="recipientName">Full Name / Entity</label>
                            <input
                                id="recipientName" name="recipientName" type="text"
                                placeholder="e.g. Jonathan Whitmore"
                                value={fields.recipientName} onChange={handleChange}
                                disabled={isPending} aria-invalid={!!errors.recipientName}
                            />
                            {errors.recipientName && <span className="transfer__field-error">{errors.recipientName}</span>}
                        </div>

                        <div className="transfer__field">
                            <label htmlFor="recipientAccountNumber">Account Number / IBAN</label>
                            <input
                                id="recipientAccountNumber" name="recipientAccountNumber" type="text"
                                placeholder="e.g. GPW4823901847 or DE89370400440532013000"
                                value={fields.recipientAccountNumber} onChange={handleChange}
                                disabled={isPending} aria-invalid={!!errors.recipientAccountNumber}
                            />
                            {errors.recipientAccountNumber && <span className="transfer__field-error">{errors.recipientAccountNumber}</span>}
                        </div>

                        <div className="transfer__field">
                            <label htmlFor="recipientBank">Destination Bank</label>
                            <div className="transfer__select-wrap">
                                <select
                                    id="recipientBank" name="recipientBank"
                                    value={fields.recipientBank} onChange={handleChange}
                                    disabled={isPending} aria-invalid={!!errors.recipientBank}
                                >
                                    <option value="" disabled>Select institution…</option>
                                    {Object.entries(groups).map(([group, banks]) => (
                                        <optgroup key={group} label={group}>
                                            {banks.map((b) => (
                                                <option key={b.value} value={b.value}>{b.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <span className="transfer__select-icon" aria-hidden><ChevronDown size={14} /></span>
                            </div>
                            {errors.recipientBank && <span className="transfer__field-error">{errors.recipientBank}</span>}
                        </div>
                    </fieldset>

                    {/* Transfer details */}
                    <fieldset className="transfer__fieldset">
                        <legend className="transfer__legend">Transfer Details</legend>

                        <div className="transfer__row">
                            <div className="transfer__field transfer__field--grow">
                                <label htmlFor="amount">Amount</label>
                                <div className="transfer__amount-wrap">
                                    <span className="transfer__amount-symbol" aria-hidden>
                                        {fields.currency === "USD" ? "$" : fields.currency === "GBP" ? "£" : fields.currency === "EUR" ? "€" : fields.currency}
                                    </span>
                                    <input
                                        id="amount" name="amount" type="number"
                                        placeholder="0.00" min="1" step="0.01"
                                        value={fields.amount} onChange={handleChange}
                                        disabled={isPending} aria-invalid={!!errors.amount}
                                        className="transfer__amount-input"
                                    />
                                </div>
                                {errors.amount && <span className="transfer__field-error">{errors.amount}</span>}
                            </div>

                            <div className="transfer__field transfer__field--currency">
                                <label htmlFor="currency">Currency</label>
                                <div className="transfer__select-wrap">
                                    <select
                                        id="currency" name="currency"
                                        value={fields.currency} onChange={handleChange}
                                        disabled={isPending}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                    <span className="transfer__select-icon" aria-hidden><ChevronDown size={14} /></span>
                                </div>
                            </div>
                        </div>

                        <div className="transfer__field">
                            <label htmlFor="note">
                                Transfer Note <span className="transfer__optional">(optional)</span>
                            </label>
                            <textarea
                                id="note" name="note" rows={2}
                                placeholder="e.g. Q2 advisory retainer, Invoice #4821…"
                                value={fields.note} onChange={handleChange}
                                disabled={isPending}
                            />
                        </div>
                    </fieldset>

                    {/* Footer */}
                    <div className="transfer__footer">
                        <p className="transfer__disclaimer">
                            All transfers are processed through SEC-regulated clearing networks.
                            International wires may take 1–3 business days to settle.
                        </p>
                        <button type="submit" className="transfer__submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <span className="transfer__spinner" aria-hidden />
                                    Processing…
                                </>
                            ) : (
                                <>
                                    <Send size={14} aria-hidden />
                                    Initiate Transfer
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* ── History panel ── */}
                <aside className="transfer__history">
                    <h2 className="transfer__history-title">Recent Transfers</h2>
                    {recentTransfers.length === 0 ? (
                        <div className="transfer__history-empty">
                            <ArrowUpRight size={24} aria-hidden />
                            <p>No transfers on record.</p>
                        </div>
                    ) : (
                        <ul className="transfer__history-list" role="list">
                            {recentTransfers.map((t) => {
                                const meta = STATUS_META[t.status] ?? STATUS_META.PENDING
                                const Icon = meta.Icon
                                const bankLabel = BANKS.find((b) => b.value === t.recipientBank)?.label ?? t.recipientBank
                                return (
                                    <li key={t.id} className="transfer__history-item">
                                        <div className="transfer__history-icon" aria-hidden>
                                            <ArrowUpRight size={13} />
                                        </div>
                                        <div className="transfer__history-info">
                                            <span className="transfer__history-name">{t.recipientName}</span>
                                            <span className="transfer__history-bank">{bankLabel}</span>
                                            <span className="transfer__history-ref">
                                                {t.reference.slice(0, 14).toUpperCase()} · {fmtDate(t.createdAt)}
                                            </span>
                                        </div>
                                        <div className="transfer__history-right">
                                            <span className="transfer__history-amount">
                                                {fmt(t.amount, t.currency)}
                                            </span>
                                            <span className={`transfer__badge ${meta.cls}`}>
                                                <Icon size={9} aria-hidden />
                                                {meta.label}
                                            </span>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </aside>
            </div>
        </div>
    )
}