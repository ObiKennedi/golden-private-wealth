"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Send, ArrowUpRight, Clock, CheckCircle, XCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react"
import { submitTransferAction, verifyInternalAccountAction } from "@/actions/transfer"

// ── Bank list ─────────────────────────────────────────────────
const BANKS = [
    { group: "Internal", value: "GOLDEN_PRIVATE_WEALTH", label: "Golden Private Wealth Bank" },
    // ── UK High Street Banks ──
    { group: "UK High Street Banks", value: "BARCLAYS", label: "Barclays" },
    { group: "UK High Street Banks", value: "HSBC_UK", label: "HSBC UK" },
    { group: "UK High Street Banks", value: "LLOYDS", label: "Lloyds Bank" },
    { group: "UK High Street Banks", value: "NATWEST", label: "NatWest" },
    { group: "UK High Street Banks", value: "SANTANDER_UK", label: "Santander UK" },
    { group: "UK High Street Banks", value: "STANDARD_CHARTERED", label: "Standard Chartered" },
    { group: "UK High Street Banks", value: "TSB", label: "TSB Bank" },
    { group: "UK High Street Banks", value: "METRO_BANK", label: "Metro Bank" },
    { group: "UK High Street Banks", value: "VIRGIN_MONEY", label: "Virgin Money" },
    { group: "UK High Street Banks", value: "CO_OP_BANK", label: "The Co-operative Bank" },
    // ── UK Building Societies ──
    { group: "UK Building Societies", value: "NATIONWIDE", label: "Nationwide Building Society" },
    { group: "UK Building Societies", value: "YORKSHIRE_BS", label: "Yorkshire Building Society" },
    { group: "UK Building Societies", value: "COVENTRY_BS", label: "Coventry Building Society" },
    { group: "UK Building Societies", value: "SKIPTON_BS", label: "Skipton Building Society" },
    { group: "UK Building Societies", value: "WEST_BROMWICH_BS", label: "West Bromwich Building Society" },
    { group: "UK Building Societies", value: "LEEDS_BS", label: "Leeds Building Society" },
    // ── UK Private & Investment Banks ──
    { group: "UK Private & Investment Banks", value: "COUTTS", label: "Coutts & Co" },
    { group: "UK Private & Investment Banks", value: "HANDELSBANKEN", label: "Handelsbanken UK" },
    { group: "UK Private & Investment Banks", value: "INVESTEC", label: "Investec Bank" },
    { group: "UK Private & Investment Banks", value: "CLOSE_BROTHERS", label: "Close Brothers" },
    { group: "UK Private & Investment Banks", value: "ARBUTHNOT_LATHAM", label: "Arbuthnot Latham" },
    { group: "UK Private & Investment Banks", value: "C_HOARE", label: "C. Hoare & Co" },
    { group: "UK Private & Investment Banks", value: "WEATHERBYS", label: "Weatherbys Private Bank" },
    // ── UK Challenger & Digital Banks ──
    { group: "UK Challenger & Digital Banks", value: "MONZO", label: "Monzo" },
    { group: "UK Challenger & Digital Banks", value: "STARLING", label: "Starling Bank" },
    { group: "UK Challenger & Digital Banks", value: "REVOLUT", label: "Revolut" },
    { group: "UK Challenger & Digital Banks", value: "MONESE", label: "Monese" },
    { group: "UK Challenger & Digital Banks", value: "ATOM_BANK", label: "Atom Bank" },
    { group: "UK Challenger & Digital Banks", value: "TANDEM", label: "Tandem Bank" },
    { group: "UK Challenger & Digital Banks", value: "ZOPA", label: "Zopa Bank" },
    { group: "UK Challenger & Digital Banks", value: "CHASE_UK", label: "Chase UK" },
    { group: "UK Challenger & Digital Banks", value: "KROO", label: "Kroo Bank" },
    // ── International Banks (UK-accessible) ──
    { group: "International Banks", value: "DEUTSCHE_BANK", label: "Deutsche Bank" },
    { group: "International Banks", value: "BNP_PARIBAS", label: "BNP Paribas" },
    { group: "International Banks", value: "SOCIETE_GENERALE", label: "Société Générale" },
    { group: "International Banks", value: "ING", label: "ING Bank" },
    { group: "International Banks", value: "UBS", label: "UBS" },
    { group: "International Banks", value: "CREDIT_SUISSE", label: "Credit Suisse" },
    { group: "International Banks", value: "ABN_AMRO", label: "ABN AMRO" },
    { group: "International Banks", value: "RABOBANK", label: "Rabobank" },
    { group: "International Banks", value: "RBC", label: "Royal Bank of Canada" },
    { group: "International Banks", value: "ANZ", label: "ANZ Bank" },
    { group: "International Banks", value: "DBS", label: "DBS Bank" },
    { group: "International Banks", value: "MIZUHO", label: "Mizuho Bank" },
    { group: "International Banks", value: "ICBC", label: "ICBC" },
    // ── Global Fintech ──
    { group: "Global Fintech", value: "WISE", label: "Wise (TransferWise)" },
    { group: "Global Fintech", value: "N26", label: "N26" },
    { group: "Global Fintech", value: "NUBANK", label: "Nubank" },
    { group: "Global Fintech", value: "BUNQ", label: "bunq" },
    { group: "Global Fintech", value: "PAYONEER", label: "Payoneer" },
    { group: "Global Fintech", value: "AIRWALLEX", label: "Airwallex" },
    { group: "Global Fintech", value: "STRIPE", label: "Stripe Treasury" },
    // ── Other ──
    { group: "Can't find your bank?", value: "OTHER", label: "Other — enter manually" },
]

const CURRENCIES = [
    { value: "GBP", label: "GBP — British Pound" },
    { value: "EUR", label: "EUR — Euro" },
    { value: "USD", label: "USD — US Dollar" },
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

function fmt(amount: number, currency = "GBP") {
    return new Intl.NumberFormat("en-GB", {
        style: "currency", currency, minimumFractionDigits: 2,
    }).format(amount)
}

function fmtDate(iso: string) {
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso))
}

interface Transfer {
    id: string
    recipientName: string
    recipientBank: string
    bankOther?: string
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
        bankOther: "",
        amount: "",
        currency: "GBP",
        note: "",
    })
    const [errors, setErrors] = useState<Partial<Record<keyof typeof fields, string>>>({})
    const [globalError, setGlobalError] = useState<string | null>(null)

    const [acctVerify, setAcctVerify] = useState<{
        status: "idle" | "checking" | "valid" | "invalid"
        message: string
        holderName?: string
        resolvedAccountNumber?: string
    }>({ status: "idle", message: "" })
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const isInternal = fields.recipientBank === "GOLDEN_PRIVATE_WEALTH"
    const isOther = fields.recipientBank === "OTHER"

    useEffect(() => {
        if (!isInternal) { setAcctVerify({ status: "idle", message: "" }); return }
        const num = fields.recipientAccountNumber.trim()
        if (!num) { setAcctVerify({ status: "idle", message: "" }); return }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setAcctVerify({ status: "checking", message: "Verifying account…" })
        debounceRef.current = setTimeout(async () => {
            const result = await verifyInternalAccountAction(num)
            if (result.valid) {
                setAcctVerify({ status: "valid", message: result.message ?? "", holderName: result.holderName, resolvedAccountNumber: result.resolvedAccountNumber })
                if (result.holderName) setFields(p => ({ ...p, recipientName: result.holderName! }))
            } else {
                setAcctVerify({ status: "invalid", message: result.message ?? "Account not found." })
            }
        }, 600)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [fields.recipientAccountNumber, isInternal])

    const [modalData, setModalData] = useState<{
        isVisible: boolean; isInternal: boolean; reference: string | null
        amount: string; recipientName: string; bank: string
    } | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFields(p => ({ ...p, [name]: value }))
        if (errors[name as keyof typeof fields]) setErrors(p => ({ ...p, [name]: undefined }))
        // Clear bankOther when switching away from OTHER
        if (name === "recipientBank" && value !== "OTHER") {
            setFields(p => ({ ...p, recipientBank: value, bankOther: "" }))
        }
    }

    const validate = () => {
        const e: Partial<Record<keyof typeof fields, string>> = {}
        if (isInternal && acctVerify.status !== "valid")
            e.recipientAccountNumber = "Please enter a valid GPW account number and wait for verification."
        if (!fields.recipientName.trim()) e.recipientName = "Recipient name is required."
        if (!fields.recipientAccountNumber.trim()) e.recipientAccountNumber = e.recipientAccountNumber || "Account number is required."
        if (!fields.recipientBank) e.recipientBank = "Please select a destination bank."
        if (isOther && !fields.bankOther.trim()) e.bankOther = "Please enter your bank name."
        const amt = parseFloat(fields.amount)
        if (!fields.amount || isNaN(amt)) e.amount = "Enter a valid amount."
        else if (amt < 1) e.amount = "Minimum transfer is £1.00."
        else if (amt > 10_000_000) e.amount = "Maximum single transfer is £10,000,000."
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
            if (isInternal && acctVerify.resolvedAccountNumber)
                fd.set("recipientAccountNumber", acctVerify.resolvedAccountNumber)
            fd.append("userId", userId)
            const result = await submitTransferAction(null, fd)
            if (result?.globalError) { setGlobalError(result.globalError); return }

            const bankLabel = isOther
                ? fields.bankOther
                : BANKS.find(b => b.value === fields.recipientBank)?.label ?? fields.recipientBank

            setModalData({
                isVisible: true,
                isInternal: result?.isInternal || false,
                reference: result?.reference || "N/A",
                amount: fields.amount,
                recipientName: fields.recipientName,
                bank: bankLabel,
            })
        })
    }

    const closeModal = () => {
        setModalData(null)
        setAcctVerify({ status: "idle", message: "" })
        setFields({ recipientName: "", recipientAccountNumber: "", recipientBank: "", bankOther: "", amount: "", currency: "GBP", note: "" })
        router.refresh()
    }

    const groups = BANKS.reduce<Record<string, typeof BANKS>>((acc, b) => {
        if (!acc[b.group]) acc[b.group] = []
        acc[b.group].push(b)
        return acc
    }, {})

    return (
        <div className="transfer">

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

                <form className="transfer__form" onSubmit={handleSubmit} noValidate>

                    {globalError && (
                        <div className="transfer__alert" role="alert">
                            <AlertCircle size={14} aria-hidden />
                            <p>{globalError}</p>
                        </div>
                    )}

                    <fieldset className="transfer__fieldset">
                        <legend className="transfer__legend">Recipient Details</legend>

                        <div className="transfer__field">
                            <label htmlFor="recipientName">Full Name / Entity</label>
                            <input
                                id="recipientName" name="recipientName" type="text"
                                placeholder="e.g. Jonathan Whitmore"
                                value={fields.recipientName} onChange={handleChange}
                                disabled={isPending || (isInternal && acctVerify.status === "valid")}
                                aria-invalid={!!errors.recipientName}
                                readOnly={isInternal && acctVerify.status === "valid"}
                                style={isInternal && acctVerify.status === "valid" ? { opacity: 0.7, cursor: "not-allowed" } : undefined}
                            />
                            {errors.recipientName && <span className="transfer__field-error">{errors.recipientName}</span>}
                        </div>

                        <div className="transfer__field">
                            <label htmlFor="recipientAccountNumber">Account Number / IBAN</label>
                            <input
                                id="recipientAccountNumber" name="recipientAccountNumber" type="text"
                                placeholder={isInternal ? "e.g. GPW9039327915 or GPW9039327915-CHK" : "e.g. GB29 NWBK 6016 1331 9268 19"}
                                value={fields.recipientAccountNumber} onChange={handleChange}
                                disabled={isPending} aria-invalid={!!errors.recipientAccountNumber}
                            />
                            {isInternal && acctVerify.status !== "idle" && (
                                <span
                                    className={`transfer__acct-verify transfer__acct-verify--${acctVerify.status === "valid" ? "valid" :
                                            acctVerify.status === "invalid" ? "invalid" : "checking"
                                        }`}
                                    role="status"
                                >
                                    {acctVerify.status === "checking" && <Loader2 size={12} className="transfer__acct-spin" aria-hidden />}
                                    {acctVerify.status === "valid" && <ShieldCheck size={12} aria-hidden />}
                                    {acctVerify.status === "invalid" && <XCircle size={12} aria-hidden />}
                                    {acctVerify.message}
                                </span>
                            )}
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
                                            {banks.map(b => (
                                                <option key={b.value} value={b.value}>{b.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <span className="transfer__select-icon" aria-hidden><ChevronDown size={14} /></span>
                            </div>
                            {errors.recipientBank && <span className="transfer__field-error">{errors.recipientBank}</span>}

                            {isOther && (
                                <div className="transfer__field" style={{ marginTop: 10 }}>
                                    <label htmlFor="bankOther">Bank name</label>
                                    <input
                                        id="bankOther" name="bankOther" type="text"
                                        placeholder="e.g. First National Bank of Lagos"
                                        value={fields.bankOther} onChange={handleChange}
                                        disabled={isPending} aria-invalid={!!errors.bankOther}
                                    />
                                    <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                                        Enter the full name of your bank or financial institution.
                                    </p>
                                    {errors.bankOther && <span className="transfer__field-error">{errors.bankOther}</span>}
                                </div>
                            )}
                        </div>
                    </fieldset>

                    <fieldset className="transfer__fieldset">
                        <legend className="transfer__legend">Transfer Details</legend>

                        <div className="transfer__row">
                            <div className="transfer__field transfer__field--grow">
                                <label htmlFor="amount">Amount</label>
                                <div className="transfer__amount-wrap">
                                    <span className="transfer__amount-symbol" aria-hidden>
                                        {fields.currency === "GBP" ? "£"
                                            : fields.currency === "EUR" ? "€"
                                                : fields.currency === "USD" ? "$"
                                                    : fields.currency}
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
                                        {CURRENCIES.map(c => (
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

                    <div className="transfer__footer">
                        <p className="transfer__disclaimer">
                            All transfers are processed through FCA-regulated payment networks.
                            International wires may take 1–3 business days to settle.
                            Faster Payments eligible transfers arrive same day.
                        </p>
                        <div className="transfer__footer-actions">
                            <button
                                type="button" className="transfer__cancel"
                                onClick={() => router.push("/user")}
                                disabled={isPending}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="transfer__submit" disabled={isPending}>
                                {isPending ? (
                                    <><span className="transfer__spinner" aria-hidden />Processing…</>
                                ) : (
                                    <><Send size={14} aria-hidden />Initiate Transfer</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                <aside className="transfer__history">
                    <h2 className="transfer__history-title">Recent Transfers</h2>
                    {recentTransfers.length === 0 ? (
                        <div className="transfer__history-empty">
                            <ArrowUpRight size={24} aria-hidden />
                            <p>No transfers on record.</p>
                        </div>
                    ) : (
                        <ul className="transfer__history-list" role="list">
                            {recentTransfers.map(t => {
                                const meta = STATUS_META[t.status] ?? STATUS_META.PENDING
                                const Icon = meta.Icon
                                const bankLabel = t.recipientBank === "OTHER"
                                    ? (t.bankOther ?? "Other")
                                    : BANKS.find(b => b.value === t.recipientBank)?.label ?? t.recipientBank
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

            {modalData?.isVisible && (
                <div className="transfer__modal-overlay">
                    <div className="transfer__modal">
                        <div className="transfer__modal-header">
                            <h2>{modalData.isInternal ? "Transfer Successful" : "Transfer Pending"}</h2>
                            <button onClick={closeModal} aria-label="Close" className="transfer__modal-close">
                                <XCircle size={20} />
                            </button>
                        </div>
                        <div className="transfer__modal-body">
                            {modalData.isInternal ? (
                                <div className="transfer__modal-icon transfer__modal-icon--success">
                                    <CheckCircle size={40} />
                                </div>
                            ) : (
                                <div className="transfer__modal-icon transfer__modal-icon--pending">
                                    <Clock size={40} />
                                </div>
                            )}
                            <p className="transfer__modal-status">
                                {modalData.isInternal
                                    ? "Your internal transfer has been processed successfully."
                                    : "Transaction pending. Please contact customer care for approval."}
                            </p>
                            <div className="transfer__modal-details">
                                <div className="transfer__modal-detail">
                                    <span>Amount</span>
                                    <strong>{fmt(parseFloat(modalData.amount), fields.currency)}</strong>
                                </div>
                                <div className="transfer__modal-detail">
                                    <span>Recipient</span>
                                    <strong>{modalData.recipientName}</strong>
                                </div>
                                <div className="transfer__modal-detail">
                                    <span>Bank</span>
                                    <strong>{modalData.bank}</strong>
                                </div>
                                <div className="transfer__modal-detail">
                                    <span>Reference</span>
                                    <strong>{modalData.reference}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="transfer__modal-footer">
                            <button onClick={closeModal} className="transfer__modal-btn">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}