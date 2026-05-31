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
