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

export async function updatePasswordAction(userId: string, currentPasswordRaw: string, newPasswordRaw: string) {
    try {
        const bcrypt = (await import("bcrypt")).default;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return { error: "User not found." };
        
        const matching = await bcrypt.compare(currentPasswordRaw, user.passwordHash);
        if (!matching) return { error: "Current password is incorrect." };

        const targetHash = await bcrypt.hash(newPasswordRaw, 12);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: targetHash }
        });
        return { success: true };
    } catch {
        return { error: "Failed to update password. Please try again." };
    }
}