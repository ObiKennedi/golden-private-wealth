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

export async function deleteUserAction(userId: string) {
    if (!(await verifyAdmin())) return { error: "Unauthorized" }

    try {
        await prisma.user.delete({ where: { id: userId } })
        return { success: true }
    } catch (err: any) {
        console.error("[deleteUserAction]", err)
        return { error: "Failed to delete user." }
    }
}

export async function suspendUserAction(userId: string, days: number) {
    if (!(await verifyAdmin())) return { error: "Unauthorized" }

    if (days <= 0) return { error: "Suspension days must be positive." }

    try {
        const suspendedUntil = new Date()
        suspendedUntil.setDate(suspendedUntil.getDate() + days)

        await prisma.user.update({
            where: { id: userId },
            data: { status: "SUSPENDED", suspendedUntil }
        })
        return { success: true }
    } catch (err: any) {
        console.error("[suspendUserAction]", err)
        return { error: "Failed to suspend user." }
    }
}

export async function unsuspendUserAction(userId: string) {
    if (!(await verifyAdmin())) return { error: "Unauthorized" }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { status: "ACTIVE", suspendedUntil: null }
        })
        return { success: true }
    } catch (err: any) {
        console.error("[unsuspendUserAction]", err)
        return { error: "Failed to lift suspension." }
    }
}

export async function updateUserAction(userId: string, data: { fullName: string, email: string, ssn: string, avatarUrl: string, joinedAt?: string }) {
    if (!(await verifyAdmin())) return { error: "Unauthorized" }

    try {
        const updateData: Record<string, unknown> = {
            fullName: data.fullName,
            email: data.email,
            ssn: data.ssn,
            avatarUrl: data.avatarUrl || null,
        }

        if (data.joinedAt) {
            const parsed = new Date(data.joinedAt)
            if (!isNaN(parsed.getTime())) {
                updateData.createdAt = parsed
            }
        }

        await prisma.user.update({ where: { id: userId }, data: updateData })
        return { success: true }
    } catch (err: any) {
        console.error("[updateUserAction]", err)
        if (err.code === 'P2002') {
            return { error: "Email or Tax ID is already in use by another account." }
        }
        return { error: "Failed to update user." }
    }
}
