"use server";

import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { generateAndHashOtp, sendVerificationEmail } from "@/lib/crypto";
import {
    SignUpSchema, LoginSchema, VerifyOtpSchema, ForgotPasswordSchema, ResetPasswordSchema
} from "@/lib/schemas";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

async function createSessionToken(userId: string, role: string) {
    const token = await new SignJWT({ userId, role })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set("golden_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 2,
        path: "/",
    });
}

// Helper utility to match and validate active tokens
async function validateAndBurnOtp(email: string, code: string, type: any) {
    const user = await prisma.user.findUnique({ where: { email }, include: { otps: true } });
    if (!user) return { success: false, msg: "Invalid parameter data." };

    const hashedInbound = crypto.createHash("sha256").update(code).digest("hex");
    const validOtp = await prisma.oneTimePassword.findFirst({
        where: {
            userId: user.id,
            code: hashedInbound,
            type,
            used: false,
            expiresAt: { gte: new Date() }
        }
    });

    if (!validOtp) return { success: false, msg: "Token validation rejected or expired." };

    await prisma.oneTimePassword.update({
        where: { id: validOtp.id },
        data: { used: true }
    });

    return { success: true, user };
}

// ==========================================
// 1. REGISTRATION DISPATCH ACTION
// ==========================================
export async function signUpAction(prevState: any, formData: FormData) {
    const validated = SignUpSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { fullName, email, password, ssn } = validated.data;

    try {
        const activeCheck = await prisma.user.findUnique({ where: { email } });
        if (activeCheck) return { globalError: "Identity architecture already assigned to this profile." };

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { fullName, email, passwordHash, ssnEncrypted: ssn }
        });

        const token = generateAndHashOtp();
        await prisma.oneTimePassword.create({
            data: {
                code: token.hashed,
                type: "EMAIL_VERIFICATION",
                expiresAt: new Date(Date.now() + 1000 * 60 * 15),
                userId: user.id
            }
        });

        await sendVerificationEmail(user.email, token.raw, "EMAIL_VERIFICATION");
    } catch {
        return { globalError: "Infrastructure runtime allocation fault." };
    }

    redirect(`/verify-email?target=${encodeURIComponent(email)}`);
}

// ==========================================
// 2. REGISTRATION EMAIL VERIFICATION
// ==========================================
export async function verifyEmailAction(prevState: any, formData: FormData) {
    const validated = VerifyOtpSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { email, code } = validated.data;

    try {
        const outcome = await validateAndBurnOtp(email, code, "EMAIL_VERIFICATION");
        if (!outcome.success) return { globalError: outcome.msg };

        await prisma.user.update({
            where: { id: outcome.user!.id },
            data: { emailVerified: true }
        });

        await createSessionToken(outcome.user!.id, outcome.user!.role);
    } catch {
        return { globalError: "Verification state configuration breakdown." };
    }

    redirect("/dashboard");
}

// ==========================================
// 3. SECURE AUTHENTICATION LOGIN ACTION
// ==========================================
export async function loginAction(prevState: any, formData: FormData) {
    const validated = LoginSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { email, password } = validated.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return { globalError: "Access signature validation failed." };

        const matching = await bcrypt.compare(password, user.passwordHash);
        if (!matching) return { globalError: "Access signature validation failed." };

        if (!user.emailVerified) {
            // Re-trigger verification if profile confirmation is pending
            const token = generateAndHashOtp();
            await prisma.oneTimePassword.create({
                data: {
                    code: token.hashed,
                    type: "EMAIL_VERIFICATION",
                    expiresAt: new Date(Date.now() + 1000 * 60 * 15),
                    userId: user.id
                }
            });
            await sendVerificationEmail(user.email, token.raw, "EMAIL_VERIFICATION");
            redirect(`/verify-email?target=${encodeURIComponent(email)}`);
        }

        // Secondary structural login safety check option
        const token = generateAndHashOtp();
        await prisma.oneTimePassword.create({
            data: {
                code: token.hashed,
                type: "LOGIN_OTP",
                expiresAt: new Date(Date.now() + 1000 * 60 * 5),
                userId: user.id
            }
        });

        await sendVerificationEmail(user.email, token.raw, "LOGIN_OTP");
    } catch (err: any) {
        if (err.message && err.message.includes("NEXT_REDIRECT")) throw err;
        return { globalError: "Execution pipeline handling anomaly." };
    }

    redirect(`/verify-login?target=${encodeURIComponent(email)}`);
}

// Secondary verification execution processing action for step-2 login verification
export async function completeLoginOtpAction(prevState: any, formData: FormData) {
    const validated = VerifyOtpSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { email, code } = validated.data;

    try {
        const check = await validateAndBurnOtp(email, code, "LOGIN_OTP");
        if (!check.success) return { globalError: check.msg };

        await createSessionToken(check.user!.id, check.user!.role);
    } catch {
        return { globalError: "Verification credential check failed." };
    }

    redirect("/dashboard");
}

// ==========================================
// 4. FORGOT PASSWORD DISPATCH ACTION
// ==========================================
export async function forgotPasswordAction(prevState: any, formData: FormData) {
    const validated = ForgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { email } = validated.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Keep user presence ambiguous for security reasons to mitigate enumeration scanning
        if (!user) return { messageDispatch: true };

        const token = generateAndHashOtp();
        await prisma.oneTimePassword.create({
            data: {
                code: token.hashed,
                type: "PASSWORD_RESET",
                expiresAt: new Date(Date.now() + 1000 * 60 * 15),
                userId: user.id
            }
        });

        await sendVerificationEmail(user.email, token.raw, "PASSWORD_RESET");
    } catch {
        return { globalError: "Recovery pipeline failure." };
    }

    redirect(`/reset-password?target=${encodeURIComponent(email)}`);
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
    const validated = ResetPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { email, code, newPassword } = validated.data;

    try {
        const result = await validateAndBurnOtp(email, code, "PASSWORD_RESET");
        if (!result.success) return { globalError: result.msg };

        const targetHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: result.user!.id },
            data: { passwordHash: targetHash }
        });
    } catch {
        return { globalError: "Failed to update record profiles." };
    }

    redirect("/login?reset=success");
}

// ==========================================
// 5. RESEND OTP DISPATCH ACTION
// ==========================================
export async function resendOtpAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const purpose = formData.get("purpose") as string;

    if (!email || !purpose) return { globalError: "Invalid dispatch parameters." };

    // Validate purpose is a known OTP type
    const allowedTypes = ["EMAIL_VERIFICATION", "LOGIN_OTP", "PASSWORD_RESET"] as const;
    type OtpType = typeof allowedTypes[number];
    if (!allowedTypes.includes(purpose as OtpType)) {
        return { globalError: "Unrecognized token classification." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Stay ambiguous — don't reveal whether the email exists
        if (!user) return { success: true };

        // Rate-limit: block if an unexpired, unused token already exists
        // issued within the last 60 seconds
        const recentOtp = await prisma.oneTimePassword.findFirst({
            where: {
                userId: user.id,
                type: purpose as OtpType,
                used: false,
                expiresAt: { gte: new Date() },
                createdAt: { gte: new Date(Date.now() - 1000 * 60) },
            },
        });

        if (recentOtp) {
            return { globalError: "A code was dispatched recently. Please wait before requesting another." };
        }

        // Invalidate all prior unused tokens of this type for this user
        await prisma.oneTimePassword.updateMany({
            where: {
                userId: user.id,
                type: purpose as OtpType,
                used: false,
            },
            data: { used: true },
        });

        // Issue fresh token
        const token = generateAndHashOtp();
        await prisma.oneTimePassword.create({
            data: {
                code: token.hashed,
                type: purpose as OtpType,
                expiresAt: new Date(Date.now() + 1000 * 60 * 15),
                userId: user.id,
            },
        });

        await sendVerificationEmail(user.email, token.raw, purpose as OtpType);
    } catch {
        return { globalError: "Dispatch pipeline failure. Try again shortly." };
    }

    return { success: true };
}