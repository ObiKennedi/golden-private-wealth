import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import AdminUsersClient from "@/components/admin/AdminUsersClient"
import "@/styles/admin/users.scss"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

export default async function AdminUsersPage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("golden_session")?.value
    if (!token) redirect("/login")

    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET)
        if (payload.role !== "ADMIN") redirect("/user/home")
    } catch {
        redirect("/login")
    }

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            fullName: true,
            email: true,
            accountNumber: true,
            ssn: true,
            status: true,
            suspendedUntil: true,
            role: true,
            emailVerified: true,
            avatarUrl: true,
            createdAt: true,
            accounts: {
                select: {
                    id: true,
                    type: true,
                    currency: true,
                    balance: true,
                    accountNumber: true,
                }
            },
            _count: {
                select: {
                    transfers: true,
                    loans: true,
                }
            }
        }
    })

    const serialized = users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        suspendedUntil: u.suspendedUntil ? u.suspendedUntil.toISOString() : null,
        accounts: u.accounts.map((a) => ({
            ...a,
            balance: Number(a.balance),
        })),
    }))

    // Total AUM across all accounts
    const totalAUM = serialized.reduce(
        (sum, u) => sum + u.accounts.reduce((s, a) => s + a.balance, 0), 0
    )

    return (
        <div className="adminusers">
            <AdminUsersClient users={serialized} totalAUM={totalAUM} />
        </div>
    )
}