"use server"

import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

async function verifyAdmin() {
    const cookieStore = await cookies()
    const token = cookieStore.get("golden_session")?.value
    if (!token) return false
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return payload.role === "ADMIN"
    } catch {
        return false
    }
}

export async function updateAccountBalanceAction(accountId: string, newBalance: number) {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { error: "Unauthorized." }

    if (typeof newBalance !== "number" || isNaN(newBalance) || newBalance < 0) {
        return { error: "Invalid balance value." }
    }

    try {
        await prisma.account.update({
            where: { id: accountId },
            data: { balance: newBalance },
        })
        return { success: true }
    } catch (err: any) {
        console.error("[updateAccountBalanceAction]", err)
        return { error: "Failed to update balance. Please try again." }
    }
}