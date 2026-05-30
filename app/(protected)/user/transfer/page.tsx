import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import TransferClient from "@/components/user/TransferClient"
import "@/styles/user/transfer.scss"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

export default async function TransferPage() {
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

    // Fetch recent transfers for history panel
    const recentTransfers = await prisma.transfer.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 8,
    })

    return (
        <div className="transferpage">
            <TransferClient
                userId={user.id}
                accountNumber={user.accountNumber}
                fullName={user.fullName}
                recentTransfers={recentTransfers.map((t) => ({
                    id: t.id,
                    recipientName: t.recipientName,
                    recipientBank: t.recipientBank,
                    amount: Number(t.amount),
                    currency: t.currency,
                    status: t.status,
                    reference: t.reference,
                    createdAt: t.createdAt.toISOString(),
                }))}
            />
        </div>
    )
}