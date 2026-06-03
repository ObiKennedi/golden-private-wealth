"use server"

import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"
import { z } from "zod"

export async function verifyInternalAccountAction(accountNumber: string) {
    if (!accountNumber || accountNumber.length < 4) {
        return { valid: false, message: "" }
    }
    const input = accountNumber.trim().toUpperCase()
    try {
        // 1. Try exact account number match first (e.g. GPW123-CHK)
        let account = await prisma.account.findUnique({
            where: { accountNumber: input },
            include: { user: { select: { fullName: true } } }
        })

        // 2. Fallback: user entered their root account number (e.g. GPW123 without suffix)
        //    Look up the user by accountNumber, then grab their CHECKING account
        if (!account) {
            const user = await prisma.user.findUnique({
                where: { accountNumber: input },
                include: {
                    accounts: {
                        where: { type: "CHECKING" },
                        select: { accountNumber: true, type: true }
                    }
                }
            })
            if (user && user.accounts.length > 0) {
                const checking = user.accounts[0]
                return {
                    valid: true,
                    message: `✓ Verified — ${user.fullName} (CHECKING · ${checking.accountNumber})`,
                    holderName: user.fullName,
                    // Return the real account number to use for the transfer
                    resolvedAccountNumber: checking.accountNumber,
                }
            }
        }

        if (!account) {
            return { valid: false, message: "Account not found. Please check the account number." }
        }

        return {
            valid: true,
            message: `✓ Verified — ${account.user.fullName} (${account.type})`,
            holderName: account.user.fullName,
            resolvedAccountNumber: account.accountNumber,
        }
    } catch {
        return { valid: false, message: "Could not verify account. Please try again." }
    }
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

const TransferSchema = z.object({
    userId: z.string().min(1),
    recipientName: z.string().min(2, "Recipient name is required."),
    recipientAccountNumber: z.string().min(4, "Account number is required."),
    recipientBank: z.string().min(1, "Please select a destination bank."),
    amount: z.coerce.number({ message: "Enter a valid amount." })
        .min(1, "Minimum transfer is £1.00.")
        .max(10_000_000, "Maximum single transfer is £10,000,000."),
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

        const isInternal = recipientBank === "GOLDEN_PRIVATE_WEALTH"

        if (isInternal) {
            // Find receiver account
            const receiverAccount = await prisma.account.findUnique({
                where: { accountNumber: recipientAccountNumber }
            })

            if (!receiverAccount) {
                return { globalError: "Internal recipient account not found. Please verify the account number." }
            }

            // Find sender checking account
            const senderAccount = await prisma.account.findFirst({
                where: { userId, type: "CHECKING" }
            })

            if (!senderAccount) {
                return { globalError: "You do not have a CHECKING account to send from." }
            }

            if (Number(senderAccount.balance) < amount) {
                return { globalError: `Insufficient balance. Your checking account holds ${new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(amount)}.` }
            }

            await prisma.$transaction(async (tx) => {
                // Deduct sender
                await tx.account.update({
                    where: { id: senderAccount.id },
                    data: { balance: { decrement: amount } }
                })

                // Credit receiver
                await tx.account.update({
                    where: { id: receiverAccount.id },
                    data: { balance: { increment: amount } }
                })

                // Record Transfer as COMPLETED
                const transferRecord = await tx.transfer.create({
                    data: {
                        userId,
                        recipientName,
                        recipientAccountNumber,
                        recipientBank,
                        amount,
                        currency,
                        note: note || null,
                        reference,
                        status: "COMPLETED",
                    },
                })

                // Record Transaction
                await tx.transaction.create({
                    data: {
                        referenceId: reference,
                        type: "TRANSFER",
                        status: "COMPLETED",
                        amount,
                        currency,
                        description: `Transfer to ${recipientName}`,
                        senderAccountId: senderAccount.id,
                        receiverAccountId: receiverAccount.id
                    }
                })

                // Log AuditLog for admin notification
                await tx.auditLog.create({
                    data: {
                        action: "INTERNAL_TRANSFER_COMPLETED",
                        userId,
                        metadata: {
                            transferId: transferRecord.id,
                            amount,
                            receiver: recipientAccountNumber
                        }
                    }
                })
            })

            return { success: true, reference, isInternal: true }
        }

        // External transfer logic
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

        return { success: true, reference, isInternal: false }
    } catch (err: any) {
        console.error("[submitTransferAction]", err)
        return { globalError: "We couldn't process your transfer right now. Please try again." }
    }
}