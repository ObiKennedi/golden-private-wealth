import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminTransactionsClient from "@/components/admin/AdminTransactionsClient";
import "@/styles/admin/transactions.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export default async function AdminTransactionsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
    } catch {
        redirect("/login");
    }

    const users = await prisma.user.findMany({
        where: { role: "CLIENT" },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            fullName: true,
            email: true,
            emailVerified: true,
            createdAt: true,
            accounts: {
                select: {
                    id: true,
                    type: true,
                    accountNumber: true,
                    balance: true,
                    currency: true,
                    sentTransactions: {
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            referenceId: true,
                            type: true,
                            status: true,
                            amount: true,
                            currency: true,
                            description: true,
                            createdAt: true,
                            receiverAccount: {
                                select: { accountNumber: true, user: { select: { fullName: true } } },
                            },
                        },
                    },
                    receivedTransactions: {
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            referenceId: true,
                            type: true,
                            status: true,
                            amount: true,
                            currency: true,
                            description: true,
                            createdAt: true,
                            senderAccount: {
                                select: { accountNumber: true, user: { select: { fullName: true } } },
                            },
                        },
                    },
                },
            },
        },
    });

    // Aggregate total transaction volume
    const volumeAgg = await prisma.transaction.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
    });

    const totalVolume = Number(volumeAgg._sum.amount ?? 0);
    const totalTxCount = await prisma.transaction.count();

    // Serialize for client
    const serialized = users.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        accounts: u.accounts.map(a => ({
            ...a,
            balance: Number(a.balance),
            sentTransactions: a.sentTransactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount),
                createdAt: tx.createdAt.toISOString(),
                direction: "debit" as const,
            })),
            receivedTransactions: a.receivedTransactions.map(tx => ({
                ...tx,
                amount: Number(tx.amount),
                createdAt: tx.createdAt.toISOString(),
                direction: "credit" as const,
            })),
        })),
    }));

    return (
        <AdminTransactionsClient
            users={serialized}
            totalVolume={totalVolume}
            totalTxCount={totalTxCount}
        />
    );
}