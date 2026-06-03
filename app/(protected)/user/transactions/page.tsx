import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeftRight } from "lucide-react";
import { TxSummaryAmounts } from "@/components/user/TxSummaryAmounts";
import { TransactionsList } from "@/components/user/TransactionsList";
import "@/styles/user/transactions.scss";



const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(val: { toFixed: (n: number) => string } | number, currency = "GBP") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-UK", {
        style: "currency",
        currency: currency === "USD" ? "GBP" : currency,
        minimumFractionDigits: 2,
    }).format(n);
}



// ── Page ───────────────────────────────────────────────────────────────────

export default async function TransactionsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    let userId: string;
    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        userId = payload.userId as string;
    } catch {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            accounts: true,
            loans: { where: { status: { in: ["ACTIVE", "APPROVED"] } } },
        },
    });
    if (!user) redirect("/login");

    const accountIds = user.accounts.map(a => a.id);

    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { senderAccountId: { in: accountIds } },
                { receiverAccountId: { in: accountIds } },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            senderAccount: { include: { user: { select: { fullName: true } } } },
            receiverAccount: { include: { user: { select: { fullName: true } } } },
        },
    });

    // Account balance snapshots for the summary card
    const checking = user.accounts.find(a => a.type === "CHECKING");
    const savings = user.accounts.find(a => a.type === "SAVINGS");
    const invest = user.accounts.find(a => a.type === "INVESTMENT");
    const totalLoan = user.loans.reduce((s, l) => s + Number(l.principalAmount), 0);

    const serializedTransactions = transactions.map(tx => ({
        ...tx,
        amount: Number(tx.amount),
        createdAt: tx.createdAt.toISOString(),
        senderAccount: tx.senderAccount ? {
            ...tx.senderAccount,
            balance: Number(tx.senderAccount.balance),
            createdAt: tx.senderAccount.createdAt.toISOString(),
            updatedAt: tx.senderAccount.updatedAt.toISOString(),
            ownerName: tx.senderAccount.user?.fullName ?? null,
        } : null,
        receiverAccount: tx.receiverAccount ? {
            ...tx.receiverAccount,
            balance: Number(tx.receiverAccount.balance),
            createdAt: tx.receiverAccount.createdAt.toISOString(),
            updatedAt: tx.receiverAccount.updatedAt.toISOString(),
            ownerName: tx.receiverAccount.user?.fullName ?? null,
        } : null,
    }));


    return (
        <div className="txpage">

            {/* ── Header ── */}
            <header className="txpage__header">
                <div>
                    <p className="txpage__pretitle">Account History</p>
                    <h1 className="txpage__title">Transactions</h1>
                </div>
                <TxSummaryAmounts
                    savingsBalance={Number(savings?.balance ?? 0)}
                    savingsCurrency={savings?.currency ?? "GBP"}
                    checkingBalance={Number(checking?.balance ?? 0)}
                    checkingCurrency={checking?.currency ?? "GBP"}
                    loanBalance={totalLoan}
                    investmentBalance={Number(invest?.balance ?? 0)}
                    investmentCurrency={invest?.currency ?? "GBP"}
                />
            </header>

            {/* ── List ── */}
            {transactions.length === 0 ? (
                <div className="txpage__empty">
                    <ArrowLeftRight size={32} aria-hidden="true" />
                    <p>No transactions on record.</p>
                </div>
            ) : (
                <TransactionsList transactions={serializedTransactions as any} accountIds={accountIds} />
            )}

        </div>
    );
}