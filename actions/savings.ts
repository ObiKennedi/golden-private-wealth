"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendSavingsNotificationEmail } from "@/lib/email";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

async function getSessionUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return { userId: payload.userId as string };
    } catch {
        return null;
    }
}

// ── Lock Savings ──────────────────────────────────────────────────────────────
// Moves funds from checking → savings account and creates a SavingsLock record.

export async function lockSavingsAction(prevState: any, formData: FormData) {
    const session = await getSessionUser();
    if (!session) return { globalError: "Unauthorized. Please log in again." };

    const amountRaw = formData.get("amount") as string;
    const lockDaysRaw = formData.get("lockDays") as string;
    const savingsAccountId = formData.get("savingsAccountId") as string;
    const checkingAccountId = formData.get("checkingAccountId") as string;

    const amount = parseFloat(amountRaw);
    const lockDays = parseInt(lockDaysRaw, 10);

    if (!amount || isNaN(amount) || amount <= 0) {
        return { globalError: "Please enter a valid amount." };
    }
    if (!lockDays || isNaN(lockDays) || lockDays < 1) {
        return { globalError: "Please select a valid lock duration." };
    }
    if (!savingsAccountId || !checkingAccountId) {
        return { globalError: "Account information is missing." };
    }

    try {
        // Verify accounts belong to user
        const [checking, savings] = await Promise.all([
            prisma.account.findFirst({
                where: { id: checkingAccountId, userId: session.userId, type: "CHECKING" },
            }),
            prisma.account.findFirst({
                where: { id: savingsAccountId, userId: session.userId, type: "SAVINGS" },
            }),
        ]);

        if (!checking) return { globalError: "Checking account not found." };
        if (!savings) return { globalError: "Savings account not found." };

        if (Number(checking.balance) < amount) {
            return { globalError: "Insufficient balance in your checking account." };
        }

        const unlocksAt = new Date();
        unlocksAt.setDate(unlocksAt.getDate() + lockDays);

        // Generate a collision-safe reference before entering the transaction
        const lockTxRef = `SAVL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

        await prisma.$transaction(async (tx) => {
            // Deduct from checking
            await tx.account.update({
                where: { id: checkingAccountId },
                data: { balance: { decrement: amount } },
            });

            // Credit to savings
            await tx.account.update({
                where: { id: savingsAccountId },
                data: { balance: { increment: amount } },
            });

            // Record movement as a Transaction so it appears in history
            await tx.transaction.create({
                data: {
                    referenceId: lockTxRef,
                    type: "TRANSFER",
                    status: "COMPLETED",
                    amount,
                    currency: "GBP",
                    description: `Savings lock — funds moved to vault (${lockDays}-day lock)`,
                    senderAccountId: checkingAccountId,
                    receiverAccountId: savingsAccountId,
                },
            });

            // Create lock record
            await tx.savingsLock.create({
                data: {
                    userId: session.userId,
                    savingsAccountId,
                    checkingAccountId,
                    amount,
                    lockDays,
                    unlocksAt,
                    status: "LOCKED",
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    action: "SAVINGS_LOCK_CREATED",
                    userId: session.userId,
                    metadata: {
                        amount,
                        lockDays,
                        unlocksAt: unlocksAt.toISOString(),
                        projectedInterest: +(amount * lockDays * 0.01).toFixed(2),
                        projectedTotal: +(amount + amount * lockDays * 0.01).toFixed(2),
                    },
                },
            });
        });

        revalidatePath("/user/savings");

        // Send lock confirmation email — fire-and-forget
        const lockUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, fullName: true } });
        if (lockUser) {
            sendSavingsNotificationEmail({
                to: lockUser.email,
                userName: lockUser.fullName,
                amount,
                lockDays,
                projectedInterest: +(amount * lockDays * 0.01).toFixed(2),
                projectedTotal: +(amount + amount * lockDays * 0.01).toFixed(2),
                unlocksAt,
                referenceId: lockTxRef,
                type: "LOCKED",
            }).catch(console.error);
        }

        return { success: true };
    } catch (err: any) {
        console.error("[lockSavingsAction]", err);
        return { globalError: "Failed to lock savings. Please try again." };
    }
}

// ── Request Savings Withdrawal ────────────────────────────────────────────────
// Creates a Transfer record (SAVINGS_WITHDRAWAL type) for admin to approve.

export async function requestSavingsWithdrawalAction(prevState: any, formData: FormData) {
    const session = await getSessionUser();
    if (!session) return { globalError: "Unauthorized. Please log in again." };

    const lockId = formData.get("lockId") as string;
    if (!lockId) return { globalError: "Lock ID is missing." };

    try {
        const lock = await prisma.savingsLock.findFirst({
            where: { id: lockId, userId: session.userId },
            include: { user: { select: { fullName: true, accountNumber: true } } },
        });

        if (!lock) return { globalError: "Savings lock not found." };
        if (lock.status === "PENDING_WITHDRAWAL") {
            return { globalError: "A withdrawal request is already pending admin approval." };
        }
        if (lock.status === "COMPLETED") {
            return { globalError: "This savings lock has already been settled." };
        }
        if (lock.status === "LOCKED" && new Date() < lock.unlocksAt) {
            return { globalError: "This savings lock has not matured yet." };
        }

        const principal = Number(lock.amount);
        const interest = +(principal * lock.lockDays * Number(lock.interestRatePerDay)).toFixed(2);
        const totalPayout = +(principal + interest).toFixed(2);

        const reference = `SAVW-${lock.referenceId.slice(0, 12).toUpperCase()}`;

        await prisma.$transaction(async (tx) => {
            // Create Transfer record visible in admin panel
            const transfer = await tx.transfer.create({
                data: {
                    userId: session.userId,
                    recipientName: lock.user.fullName,
                    recipientAccountNumber: lock.checkingAccountId,
                    recipientBank: "SAVINGS_WITHDRAWAL",
                    amount: totalPayout,
                    currency: lock.currency,
                    note: `SAVINGS_WITHDRAWAL:${lock.id}`,
                    reference,
                    status: "PENDING",
                },
            });

            // Update lock status
            await tx.savingsLock.update({
                where: { id: lockId },
                data: {
                    status: "PENDING_WITHDRAWAL",
                    withdrawalTransferId: transfer.id,
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    action: "SAVINGS_WITHDRAWAL_REQUESTED",
                    userId: session.userId,
                    metadata: {
                        lockId,
                        principal,
                        interest,
                        totalPayout,
                        lockDays: lock.lockDays,
                        reference,
                    },
                },
            });
        });

        revalidatePath("/user/savings");

        // Send withdrawal request email — fire-and-forget
        const withdrawUser = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, fullName: true } });
        if (withdrawUser) {
            sendSavingsNotificationEmail({
                to: withdrawUser.email,
                userName: withdrawUser.fullName,
                amount: principal,
                lockDays: lock.lockDays,
                projectedInterest: interest,
                projectedTotal: totalPayout,
                unlocksAt: lock.unlocksAt,
                referenceId: lock.referenceId,
                type: "WITHDRAWAL_REQUESTED",
            }).catch(console.error);
        }

        return { success: true };
    } catch (err: any) {
        console.error("[requestSavingsWithdrawalAction]", err);
        return { globalError: "Failed to submit withdrawal request. Please try again." };
    }
}
