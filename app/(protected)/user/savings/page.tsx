import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import SavingsClient from "@/components/user/SavingsClient";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export default async function SavingsPage() {
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
            accounts: { where: { type: { in: ["SAVINGS", "CHECKING"] } } },
            savingsLocks: { orderBy: { createdAt: "desc" } },
        },
    });
    if (!user) redirect("/login");

    const savings  = user.accounts.find(a => a.type === "SAVINGS");
    const checking = user.accounts.find(a => a.type === "CHECKING");
    if (!savings || !checking) redirect("/user");

    // ── Savings account transactions ───────────────────────────────────────
    const savingsTxRaw = await prisma.transaction.findMany({
        where: {
            OR: [
                { senderAccountId: savings.id },
                { receiverAccountId: savings.id },
            ],
        },
        orderBy: { createdAt: "desc" },
        include: {
            senderAccount:   { select: { accountNumber: true, type: true } },
            receiverAccount: { select: { accountNumber: true, type: true } },
        },
    });

    const savingsTransactions = savingsTxRaw.map(tx => ({
        id:               tx.id,
        referenceId:      tx.referenceId,
        type:             tx.type as string,
        status:           tx.status as string,
        amount:           Number(tx.amount),
        currency:         tx.currency,
        description:      tx.description,
        createdAt:        tx.createdAt.toISOString(),
        senderAccountId:   tx.senderAccountId,
        receiverAccountId: tx.receiverAccountId,
        senderAccount:   tx.senderAccount   ? { accountNumber: tx.senderAccount.accountNumber,   type: tx.senderAccount.type }   : null,
        receiverAccount: tx.receiverAccount ? { accountNumber: tx.receiverAccount.accountNumber, type: tx.receiverAccount.type } : null,
    }));

    // ── Serialize locks ────────────────────────────────────────────────────
    const serializeLock = (l: (typeof user.savingsLocks)[number]) => ({
        id:                 l.id,
        referenceId:        l.referenceId,
        amount:             Number(l.amount),
        currency:           l.currency,
        lockDays:           l.lockDays,
        interestRatePerDay: Number(l.interestRatePerDay),
        lockedAt:           l.lockedAt.toISOString(),
        unlocksAt:          l.unlocksAt.toISOString(),
        status:             l.status as "LOCKED" | "PENDING_WITHDRAWAL" | "COMPLETED" | "REJECTED",
        settledAt:          l.settledAt ? l.settledAt.toISOString() : null,
        totalInterestPaid:  l.totalInterestPaid !== null ? Number(l.totalInterestPaid) : null,
    });

    const activeLocks    = user.savingsLocks.filter(l => l.status !== "COMPLETED").map(serializeLock);
    const completedLocks = user.savingsLocks.filter(l => l.status === "COMPLETED").map(serializeLock);

    return (
        <SavingsClient
            savingsAccountId={savings.id}
            checkingAccountId={checking.id}
            savingsBalance={Number(savings.balance)}
            checkingBalance={Number(checking.balance)}
            currency={savings.currency}
            activeLocks={activeLocks}
            completedLocks={completedLocks}
            savingsTransactions={savingsTransactions}
        />
    );
}
