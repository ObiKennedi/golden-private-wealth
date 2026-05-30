"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
        return payload.userId as string;
    } catch {
        redirect("/login");
    }
}

const ApproveSchema = z.object({
    loanId: z.string().min(1),
    checkingAccountId: z.string().min(1),
    amount: z.coerce.number().positive(),
    currency: z.string().default("USD"),
    interestRate: z.coerce
        .number({ message: "Enter a valid interest rate." })
        .min(0, "Rate cannot be negative.")
        .max(100, "Rate cannot exceed 100%."),
});

export async function approveLoanAction(prevState: any, formData: FormData) {
    const adminId = await verifyAdmin();

    const validated = ApproveSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { loanId, checkingAccountId, amount, currency, interestRate } = validated.data;

    try {
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: { user: true },
        });

        if (!loan) return { globalError: "Loan not found." };
        if (!["PENDING", "UNDER_REVIEW"].includes(loan.status)) return { globalError: "Loan is not in a reviewable state." };

        const account = await prisma.account.findUnique({ where: { id: checkingAccountId } });
        if (!account) return { globalError: "Checking account not found." };

        // Calculate monthly payment using standard amortisation formula
        const monthlyRate = interestRate / 100 / 12;
        const { termMonths } = loan;
        const monthlyPayment = monthlyRate === 0
            ? amount / termMonths
            : (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths))
            / (Math.pow(1 + monthlyRate, termMonths) - 1);

        await prisma.$transaction([
            // 1. Update loan status, set rate and monthly payment
            prisma.loan.update({
                where: { id: loanId },
                data: {
                    status: "ACTIVE",
                    interestRate,
                    monthlyPayment: parseFloat(monthlyPayment.toFixed(2)),
                    approvedAt: new Date(),
                },
            }),

            // 2. Credit the user's checking account
            prisma.account.update({
                where: { id: checkingAccountId },
                data: { balance: { increment: amount } },
            }),

            // 3. Record as a DEPOSIT transaction
            prisma.transaction.create({
                data: {
                    referenceId: crypto.randomUUID(),
                    type: "DEPOSIT",
                    status: "COMPLETED",
                    amount,
                    currency,
                    description: `Loan disbursement — ${loan.type.replace(/_/g, " ")} (Ref: ${loan.referenceId.slice(0, 10).toUpperCase()})`,
                    receiverAccountId: checkingAccountId,
                },
            }),

            // 4. Write audit log
            prisma.auditLog.create({
                data: {
                    action: `LOAN_APPROVED — ${loan.user.fullName} — ${currency} ${amount.toFixed(2)}`,
                    userId: adminId,
                    metadata: { loanId, checkingAccountId, amount, interestRate },
                },
            }),
        ]);

        revalidatePath("/admin/loans");
    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        return { globalError: "Failed to process approval. Please try again." };
    }

    return { success: true };
}

export async function rejectLoanAction(prevState: any, formData: FormData) {
    const adminId = await verifyAdmin();

    const loanId = formData.get("loanId") as string;
    if (!loanId) return { globalError: "Invalid loan reference." };

    try {
        const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { user: true } });

        if (!loan) return { globalError: "Loan not found." };
        if (!["PENDING", "UNDER_REVIEW"].includes(loan.status)) return { globalError: "Loan is not in a reviewable state." };

        await prisma.$transaction([
            prisma.loan.update({
                where: { id: loanId },
                data: { status: "REJECTED", rejectedAt: new Date() },
            }),

            prisma.auditLog.create({
                data: {
                    action: `LOAN_REJECTED — ${loan.user.fullName} — ${loan.currency} ${Number(loan.principalAmount).toFixed(2)}`,
                    userId: adminId,
                    metadata: { loanId },
                },
            }),
        ]);

        revalidatePath("/admin/loans");
    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        return { globalError: "Failed to reject loan. Please try again." };
    }

    return { success: true };
}