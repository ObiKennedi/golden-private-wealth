"use server"

import { cookies } from "next/headers"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"

export async function updateAvatarAction(userId: string, url: string) {
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { avatarUrl: url },
        })
        return { success: true }
    } catch {
        return { error: "Failed to save your profile picture. Please try again." }
    }
}

export async function signOutAction() {
    const cookieStore = await cookies()
    cookieStore.delete("golden_session")
    redirect("/login")
}