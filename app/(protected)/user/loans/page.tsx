import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import type { Loan } from "@/app/generated/prisma/client"
import {
    Landmark,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    CircleDot,
    BadgeCheck,
} from "lucide-react"
import LoanApplicationForm from "@/components/user/LoanApplicationForm"
import { LoanSummaryAmounts } from "@/components/user/LoanSummaryAmounts"
import "@/styles/user/loans.scss"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

function fmt(val: number | { toFixed: (n: number) => string }, currency = "GBP") {
    return new Intl.NumberFormat("en-UK", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(Number(val))
}

function fmtDate(date: Date) {
    return new Intl.DateTimeFormat("en-UK", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date)
}

const STATUS_META: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
    PENDING: { label: "Pending", cls: "status--pending", Icon: Clock },
    UNDER_REVIEW: { label: "Under Review", cls: "status--review", Icon: AlertCircle },
    APPROVED: { label: "Approved", cls: "status--approved", Icon: BadgeCheck },
    ACTIVE: { label: "Active", cls: "status--active", Icon: CircleDot },
    REJECTED: { label: "Rejected", cls: "status--rejected", Icon: XCircle },
    CLOSED: { label: "Closed", cls: "status--closed", Icon: CheckCircle },
}

export default async function LoansPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("golden_session")?.value
    if (!token) redirect("/login")

    let userId: string
    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET)
        userId = payload.userId as string
    } catch {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) redirect("/login")

    const loans = await prisma.loan.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
    })

    const activeLoans = loans.filter((l) => l.status === "ACTIVE")
    const totalOwed = activeLoans.reduce((s, l) => s + Number(l.principalAmount), 0)
    const pendingCount = loans.filter((l) => ["PENDING", "UNDER_REVIEW"].includes(l.status)).length

    return (
        <div className="loanspage">

            {/* ── Header ── */}
            <header className="loanspage__header">
                <div>
                    <p className="loanspage__pretitle">Credit Facility</p>
                    <h1 className="loanspage__title">Loans</h1>
                </div>
                <LoanSummaryAmounts
                    totalOwed={fmt(totalOwed)}
                    activeCount={activeLoans.length}
                    pendingCount={pendingCount}
                />
            </header>

            {/* ── Loan History ── */}
            <section className="loanspage__section" aria-label="Loan history">
                <div className="loanspage__section-header">
                    <h2 className="loanspage__section-title">Loan History</h2>
                    <a href="/user/assets" className="loanspage__view-all">
                        View All
                    </a>
                </div>

                {loans.length === 0 ? (
                    <div className="loanspage__empty">
                        <Landmark size={32} aria-hidden="true" />
                        <p>No loan applications on record.</p>
                    </div>
                ) : (
                    <ul className="loanspage__list" role="list">
                        {loans.slice(0, 3).map((loan: Loan) => {
                            const meta = STATUS_META[loan.status] ?? STATUS_META.PENDING
                            const Icon = meta.Icon

                            return (
                                <li key={loan.id} className="loanspage__item">
                                    <div className="loanspage__item-left">
                                        <div className="loanspage__item-icon">
                                            <Landmark size={16} aria-hidden="true" />
                                        </div>
                                        <div className="loanspage__item-info">
                                            <span className="loanspage__item-type">
                                                {loan.type.replace(/_/g, " ")} Loan
                                            </span>
                                            <span className="loanspage__item-purpose">
                                                {loan.purpose}
                                            </span>
                                            <span className="loanspage__item-meta">
                                                Ref: {loan.referenceId.slice(0, 12).toUpperCase()}
                                                &nbsp;·&nbsp;
                                                {fmtDate(loan.createdAt)}
                                                &nbsp;·&nbsp;
                                                {loan.termMonths} months
                                                &nbsp;·&nbsp;
                                                {Number(loan.interestRate).toFixed(2)}% p.a.
                                            </span>
                                        </div>
                                    </div>
                                    <div className="loanspage__item-right">
                                        <span className="loanspage__item-amount">
                                            {fmt(loan.principalAmount, loan.currency)}
                                        </span>
                                        {loan.monthlyPayment && (
                                            <span className="loanspage__item-monthly">
                                                {fmt(loan.monthlyPayment, loan.currency)}/mo
                                            </span>
                                        )}
                                        <span className={`loanspage__badge ${meta.cls}`}>
                                            <Icon size={10} aria-hidden="true" />
                                            {meta.label}
                                        </span>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>

            {/* ── Application Form ── */}
            <section className="loanspage__section" aria-label="Apply for loan">
                <h2 className="loanspage__section-title">Apply for a Loan</h2>
                <LoanApplicationForm />
            </section>

        </div>
    )
}