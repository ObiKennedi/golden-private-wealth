"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload.role === "ADMIN";
    } catch {
        return false;
    }
}

export async function approveTransferAction(prevState: any, formData: FormData) {
    if (!(await verifyAdmin())) return { globalError: "Unauthorized" };

    const transferId = formData.get("transferId") as string;
    if (!transferId) return { globalError: "Missing transfer ID." };

    try {
        const transfer = await prisma.transfer.findUnique({
            where: { id: transferId },
            include: { user: { include: { accounts: { where: { type: "CHECKING" } } } } }
        });

        if (!transfer) return { globalError: "Transfer not found." };
        if (transfer.status !== "PENDING") return { globalError: "Transfer is not pending." };

        const checkingAccount = transfer.user.accounts[0];
        if (!checkingAccount) return { globalError: "User has no checking account." };

        const amount = Number(transfer.amount);
        if (Number(checkingAccount.balance) < amount) {
            return { globalError: "User has insufficient funds in checking account." };
        }

        await prisma.$transaction(async (tx) => {
            // Deduct
            await tx.account.update({
                where: { id: checkingAccount.id },
                data: { balance: { decrement: amount } }
            });

            // Update transfer
            await tx.transfer.update({
                where: { id: transferId },
                data: { status: "COMPLETED" }
            });

            // Create transaction history
            await tx.transaction.create({
                data: {
                    referenceId: transfer.reference,
                    type: "TRANSFER",
                    status: "COMPLETED",
                    amount: transfer.amount,
                    currency: transfer.currency,
                    description: `Transfer to ${transfer.recipientName} (${transfer.recipientBank})`,
                    senderAccountId: checkingAccount.id,
                }
            });

            // Log action
            await tx.auditLog.create({
                data: {
                    action: "ADMIN_APPROVED_TRANSFER",
                    userId: transfer.userId,
                    metadata: { transferId, amount, reference: transfer.reference }
                }
            });
        });

        return { success: true };
    } catch (err: any) {
        console.error("[approveTransferAction]", err);
        return { globalError: "Failed to approve transfer." };
    }
}

export async function rejectTransferAction(prevState: any, formData: FormData) {
    if (!(await verifyAdmin())) return { globalError: "Unauthorized" };

    const transferId = formData.get("transferId") as string;
    if (!transferId) return { globalError: "Missing transfer ID." };

    try {
        await prisma.transfer.update({
            where: { id: transferId },
            data: { status: "REJECTED" }
        });

        // Log action
        await prisma.auditLog.create({
            data: {
                action: "ADMIN_REJECTED_TRANSFER",
                metadata: { transferId }
            }
        });

        return { success: true };
    } catch (err: any) {
        console.error("[rejectTransferAction]", err);
        return { globalError: "Failed to reject transfer." };
    }
}

export async function reverseTransferAction(prevState: any, formData: FormData) {
    if (!(await verifyAdmin())) return { globalError: "Unauthorized" };

    const transferId = formData.get("transferId") as string;
    if (!transferId) return { globalError: "Missing transfer ID." };

    try {
        const transfer = await prisma.transfer.findUnique({
            where: { id: transferId },
            include: { user: { include: { accounts: { where: { type: "CHECKING" } } } } }
        });

        if (!transfer) return { globalError: "Transfer not found." };
        if (transfer.status !== "COMPLETED") return { globalError: "Transfer is not completed." };
        if (transfer.recipientBank !== "GOLDEN_PRIVATE_WEALTH") return { globalError: "Only internal transfers can be reversed." };

        const senderChecking = transfer.user.accounts[0];
        if (!senderChecking) return { globalError: "Sender has no checking account." };

        // Find receiver checking account
        const receiverAccount = await prisma.account.findUnique({
            where: { accountNumber: transfer.recipientAccountNumber }
        });

        if (!receiverAccount) return { globalError: "Receiver account not found." };

        const amount = Number(transfer.amount);

        await prisma.$transaction(async (tx) => {
            // Refund sender
            await tx.account.update({
                where: { id: senderChecking.id },
                data: { balance: { increment: amount } }
            });

            // Deduct from receiver
            await tx.account.update({
                where: { id: receiverAccount.id },
                data: { balance: { decrement: amount } }
            });

            // Update transfer status
            await tx.transfer.update({
                where: { id: transferId },
                data: { status: "REJECTED" } // Using REJECTED to denote reversal
            });

            // Create reversal transaction
            await tx.transaction.create({
                data: {
                    referenceId: "REV-" + transfer.reference.slice(0, 8),
                    type: "TRANSFER",
                    status: "COMPLETED",
                    amount: transfer.amount,
                    currency: transfer.currency,
                    description: `Reversal of transfer to ${transfer.recipientName}`,
                    senderAccountId: receiverAccount.id,
                    receiverAccountId: senderChecking.id,
                }
            });

            // Log action
            await tx.auditLog.create({
                data: {
                    action: "ADMIN_REVERSED_TRANSFER",
                    userId: transfer.userId,
                    metadata: { transferId, amount, reference: transfer.reference }
                }
            });
        });

        return { success: true };
    } catch (err: any) {
        console.error("[reverseTransferAction]", err);
        return { globalError: "Failed to reverse transfer." };
    }
}

// ── Approve Savings Withdrawal ────────────────────────────────────────────────
// Credits principal + interest to checking account, marks lock as COMPLETED.

export async function approveSavingsWithdrawalAction(prevState: any, formData: FormData) {
    if (!(await verifyAdmin())) return { globalError: "Unauthorized" };

    const transferId = formData.get("transferId") as string;
    const lockId = formData.get("lockId") as string;
    if (!transferId || !lockId) return { globalError: "Missing required parameters." };

    try {
        const lock = await prisma.savingsLock.findUnique({
            where: { id: lockId },
            include: {
                user: { select: { fullName: true } },
                savingsAccount: true,
                checkingAccount: true,
            },
        });

        if (!lock) return { globalError: "Savings lock not found." };
        if (lock.status !== "PENDING_WITHDRAWAL") {
            return { globalError: "This lock is not awaiting withdrawal." };
        }

        const principal = Number(lock.amount);
        const interest = +(principal * lock.lockDays * Number(lock.interestRatePerDay)).toFixed(2);
        const totalPayout = +(principal + interest).toFixed(2);

        await prisma.$transaction(async (tx) => {
            // Deduct from savings
            await tx.account.update({
                where: { id: lock.savingsAccountId },
                data: { balance: { decrement: principal } },
            });

            // Credit principal + interest to checking
            await tx.account.update({
                where: { id: lock.checkingAccountId },
                data: { balance: { increment: totalPayout } },
            });

            // Mark transfer as completed
            await tx.transfer.update({
                where: { id: transferId },
                data: { status: "COMPLETED" },
            });

            // Mark lock as completed
            await tx.savingsLock.update({
                where: { id: lockId },
                data: {
                    status: "COMPLETED",
                    settledAt: new Date(),
                    totalInterestPaid: interest,
                },
            });

            // Create transaction record
            await tx.transaction.create({
                data: {
                    referenceId: `SAVW-${lock.referenceId.slice(0, 10)}`,
                    type: "YIELD_PAYOUT",
                    status: "COMPLETED",
                    amount: totalPayout,
                    currency: lock.currency,
                    description: `Savings lock payout: $${principal} principal + $${interest} interest (${lock.lockDays} days @ 1%/day)`,
                    senderAccountId: lock.savingsAccountId,
                    receiverAccountId: lock.checkingAccountId,
                },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    action: "SAVINGS_WITHDRAWAL_APPROVED",
                    userId: lock.userId,
                    metadata: {
                        lockId,
                        principal,
                        interest,
                        totalPayout,
                        lockDays: lock.lockDays,
                        userName: lock.user.fullName,
                    },
                },
            });
        });

        return { success: true };
    } catch (err: any) {
        console.error("[approveSavingsWithdrawalAction]", err);
        return { globalError: "Failed to approve savings withdrawal." };
    }
}

// ── Reject Savings Withdrawal ─────────────────────────────────────────────────
// Resets lock back to LOCKED — user can re-request when ready.

export async function rejectSavingsWithdrawalAction(prevState: any, formData: FormData) {
    if (!(await verifyAdmin())) return { globalError: "Unauthorized" };

    const transferId = formData.get("transferId") as string;
    const lockId = formData.get("lockId") as string;
    if (!transferId || !lockId) return { globalError: "Missing required parameters." };

    try {
        await prisma.$transaction(async (tx) => {
            // Reset lock back to LOCKED so user can re-request
            await tx.savingsLock.update({
                where: { id: lockId },
                data: {
                    status: "LOCKED",
                    withdrawalTransferId: null,
                },
            });

            // Mark transfer as rejected
            await tx.transfer.update({
                where: { id: transferId },
                data: { status: "REJECTED" },
            });

            // Audit log
            await tx.auditLog.create({
                data: {
                    action: "SAVINGS_WITHDRAWAL_REJECTED",
                    metadata: { lockId, transferId },
                },
            });
        });

        return { success: true };
    } catch (err: any) {
        console.error("[rejectSavingsWithdrawalAction]", err);
        return { globalError: "Failed to reject savings withdrawal." };
    }
}
