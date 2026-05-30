"use server"

import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"
import { z } from "zod"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

const TransferSchema = z.object({
    userId: z.string().min(1),
    recipientName: z.string().min(2, "Recipient name is required."),
    recipientAccountNumber: z.string().min(4, "Account number is required."),
    recipientBank: z.string().min(1, "Please select a destination bank."),
    amount: z.coerce.number({ message: "Enter a valid amount." })
        .min(1, "Minimum transfer is $1.00.")
        .max(10_000_000, "Maximum single transfer is $10,000,000."),
    currency: z.string().min(3).max(3),
    note: z.string().optional(),
})

function generateReference(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let ref = "GPW-"
    for (let i = 0; i < 12; i++) {
        if (i === 4 || i === 8) ref += "-"
        ref += chars[Math.floor(Math.random() * chars.length)]
    }
    return ref
}

export async function submitTransferAction(prevState: any, formData: FormData) {
    // Verify session
    const cookieStore = await cookies()
    const token = cookieStore.get("golden_session")?.value
    if (!token) return { globalError: "Your session has expired. Please sign in again." }

    try {
        await jwtVerify(token, JWT_SECRET)
    } catch {
        return { globalError: "Your session has expired. Please sign in again." }
    }

    const validated = TransferSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const { userId, recipientName, recipientAccountNumber, recipientBank, amount, currency, note } = validated.data

    try {
        const reference = generateReference()

        await prisma.transfer.create({
            data: {
                userId,
                recipientName,
                recipientAccountNumber,
                recipientBank,
                amount,
                currency,
                note: note || null,
                reference,
                status: "PENDING",
            },
        })

        return { success: true, reference }
    } catch (err: any) {
        console.error("[submitTransferAction]", err)
        return { globalError: "We couldn't process your transfer right now. Please try again." }
    }
}