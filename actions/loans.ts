"use server"

import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { z } from "zod"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

const LoanApplicationSchema = z.object({
    type: z.enum(["PERSONAL", "MORTGAGE", "AUTO", "BUSINESS", "INVESTMENT", "LINE_OF_CREDIT"] as const, {
        message: "Select a valid loan type.",
    }),
    principalAmount: z.coerce
        .number({ message: "Enter a valid amount." })
        .min(1000, "Minimum loan amount is $1,000.")
        .max(10_000_000, "Maximum loan amount is $10,000,000."),
    termMonths: z.coerce
        .number({ message: "Select a repayment term." })
        .int()
        .min(6, "Minimum term is 6 months.")
        .max(360, "Maximum term is 30 years."),
    purpose: z.string().min(5, "Describe the purpose of the loan (min 5 characters)."),
    collateral: z.string().optional(),
    notes: z.string().optional(),
});

export async function applyForLoanAction(prevState: any, formData: FormData) {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    let userId: string;
    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        userId = payload.userId as string;
    } catch {
        redirect("/login");
    }

    const validated = LoanApplicationSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { type, principalAmount, termMonths, purpose, collateral, notes } = validated.data;

    try {
        await prisma.loan.create({
            data: {
                type,
                principalAmount,
                interestRate: 0,      // assigned by admin on review
                termMonths,
                purpose,
                collateral: collateral || null,
                notes: notes || null,
                userId,
            },
        });
    } catch {
        return { globalError: "Failed to submit application. Please try again." };
    }

    return { success: true };
}