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

function fmt(val: { toFixed: (n: number) => string } | number, currency = "USD") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

const CREDIT_TYPES = new Set(["DEPOSIT", "YIELD_PAYOUT", "ASSET_SALE"]);

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
        include: { accounts: true },
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
            senderAccount: true,
            receiverAccount: true,
        },
    });

    // Totals — a TRANSFER is income when the user's account is the receiver
    const totalIn = transactions
        .filter(tx => {
            if (CREDIT_TYPES.has(tx.type)) return true;
            if (tx.type === "TRANSFER" && tx.receiverAccountId && accountIds.includes(tx.receiverAccountId)) return true;
            return false;
        })
        .reduce((s, tx) => s + Number(tx.amount), 0);
    const totalOut = transactions
        .filter(tx => {
            if (CREDIT_TYPES.has(tx.type)) return false;
            if (tx.type === "TRANSFER" && tx.senderAccountId && accountIds.includes(tx.senderAccountId)) return true;
            if (!CREDIT_TYPES.has(tx.type) && tx.type !== "TRANSFER") return true;
            return false;
        })
        .reduce((s, tx) => s + Number(tx.amount), 0);

    return (
        <div className="txpage">

            {/* ── Header ── */}
            <header className="txpage__header">
                <div>
                    <p className="txpage__pretitle">Account History</p>
                    <h1 className="txpage__title">Transactions</h1>
                </div>
                <TxSummaryAmounts totalIn={fmt(totalIn)} totalOut={fmt(totalOut)} />
            </header>

            {/* ── List ── */}
            {transactions.length === 0 ? (
                <div className="txpage__empty">
                    <ArrowLeftRight size={32} aria-hidden="true" />
                    <p>No transactions on record.</p>
                </div>
            ) : (
                <TransactionsList transactions={transactions as any} accountIds={accountIds} />
            )}

        </div>
    );
}