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

function generateRandomPastDate(yearsBack = 15) {
    const now = new Date();
    const past = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate());
    const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(randomTime);
}

export async function createBacklogTransactionAction(prevState: any, formData: FormData) {
    if (!(await verifyAdmin())) return { globalError: "Unauthorized" };

    const userId = formData.get("userId") as string;
    const amountStr = formData.get("amount") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as string; // DEPOSIT, WITHDRAWAL, TRANSFER, etc.
    const direction = formData.get("direction") as "debit" | "credit";
    const dateStr = formData.get("date") as string;

    if (!userId || !amountStr || !type || !direction || !dateStr) {
        return { globalError: "Missing required fields." };
    }

    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) {
        return { globalError: "Invalid amount." };
    }

    const createdAt = new Date(dateStr);

    try {
        // Find the user's CHECKING account
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { accounts: { where: { type: "CHECKING" } } }
        });

        if (!user || user.accounts.length === 0) {
            return { globalError: "User has no checking account to attach transaction." };
        }

        const checkingAccount = user.accounts[0];

        await prisma.$transaction(async (tx) => {
            // Create the transaction
            const referenceId = `BKLG-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
            
            await tx.transaction.create({
                data: {
                    referenceId,
                    type: type as any,
                    status: "COMPLETED",
                    amount,
                    currency: checkingAccount.currency,
                    description: description || (direction === "credit" ? "Account Credit" : "Account Debit"),
                    senderAccountId: direction === "debit" ? checkingAccount.id : null,
                    receiverAccountId: direction === "credit" ? checkingAccount.id : null,
                    createdAt,
                }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    action: "ADMIN_CREATED_BACKLOG_TX",
                    userId,
                    metadata: { amount, direction, type, createdAt }
                }
            });
        });

        return { success: true };
    } catch (err: any) {
        console.error("[createBacklogTransactionAction]", err);
        return { globalError: "Failed to create backlog transaction." };
    }
}

export async function automateBacklogAction(prevState: any, formData: FormData) {
    if (!(await verifyAdmin())) return { globalError: "Unauthorized" };

    const userId = formData.get("userId") as string;
    if (!userId) return { globalError: "Missing user ID." };

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { accounts: { where: { type: "CHECKING" } } }
        });

        if (!user || user.accounts.length === 0) {
            return { globalError: "User has no checking account." };
        }

        const checkingAccount = user.accounts[0];
        
        const txsToCreate: any[] = [];

        const randomNames = [
            "John Smith", "Emma Johnson", "Michael Williams", "Sarah Brown",
            "David Jones", "Jessica Garcia", "James Miller", "Jennifer Davis",
            "Robert Rodriguez", "Linda Martinez", "William Hernandez",
            "Elizabeth Moore", "Richard Martin", "Maria Jackson", "Joseph Thompson"
        ];

        const randomBusinesses = [
            "Amazon", "Netflix", "Uber", "Apple Store", "Local Bakery", 
            "Gas Station", "Whole Foods", "Starbucks", "Target", "Walmart"
        ];

        for (let i = 0; i < 15; i++) {
            const isCredit = Math.random() > 0.5;
            const amount = Math.floor(Math.random() * 5000) + 100; // Between 100 and 5000
            const type = isCredit ? "DEPOSIT" : "WITHDRAWAL";
            
            let description = "";
            if (isCredit) {
                const name = randomNames[Math.floor(Math.random() * randomNames.length)];
                description = `Transfer from ${name}`;
            } else {
                const business = randomBusinesses[Math.floor(Math.random() * randomBusinesses.length)];
                description = `Payment to ${business}`;
            }

            const createdAt = generateRandomPastDate(15);
            const referenceId = `AUTO-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

            txsToCreate.push({
                referenceId,
                type: type as any,
                status: "COMPLETED",
                amount,
                currency: checkingAccount.currency,
                description,
                senderAccountId: !isCredit ? checkingAccount.id : null,
                receiverAccountId: isCredit ? checkingAccount.id : null,
                createdAt,
            });
        }

        // Sort by date so they are logically sequential (though not strictly necessary)
        txsToCreate.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        await prisma.$transaction(async (tx) => {
            // Insert transactions
            await tx.transaction.createMany({
                data: txsToCreate
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    action: "ADMIN_AUTOMATED_BACKLOG",
                    userId,
                    metadata: { count: 15 }
                }
            });
        });

        return { success: true };
    } catch (err: any) {
        console.error("[automateBacklogAction]", err);
        return { globalError: "Failed to automate backlog." };
    }
}
