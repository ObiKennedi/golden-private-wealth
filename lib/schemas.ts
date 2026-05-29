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