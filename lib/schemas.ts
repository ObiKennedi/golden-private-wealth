import { z } from "zod";

export const SignUpSchema = z.object({
    fullName: z.string().min(3, "Legal designation requires at least 3 characters."),
    email: z.string().email("Provide a valid corporate or private email address."),
    password: z.string().min(8, "Security parameters mandate minimum 8 characters."),
    ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "Provide valid SSN format (XXX-XX-XXXX)."),
});

export const LoginSchema = z.object({
    email: z.string().email("Provide a valid credentials profile email."),
    password: z.string().min(1, "Password signature required."),
});

export const VerifyOtpSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6, "Verification parameters mandate a strict 6-digit signature."),
    purpose: z.enum(["EMAIL_VERIFICATION", "LOGIN_OTP", "PASSWORD_RESET"]),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email("Provide a valid registered structural email target."),
});

export const ResetPasswordSchema = z.object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string().min(8, "New password must match target length criteria (8+ chars)."),
});

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
})