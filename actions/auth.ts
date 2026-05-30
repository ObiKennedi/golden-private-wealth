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

async function validateAndBurnOtp(email: string, code: string, type: any) {
    const user = await prisma.user.findUnique({ where: { email }, include: { otps: true } });
    if (!user) return { success: false, msg: "No account was found with that email address." };

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

    if (!validOtp) return { success: false, msg: "That code is invalid or has expired. Please request a new one." };

    await prisma.oneTimePassword.update({
        where: { id: validOtp.id },
        data: { used: true }
    });

    return { success: true, user };
}

function generateAccountNumber(): string {
    const digits = crypto.randomInt(1000000000, 9999999999).toString();
    return `GPW${digits}`;
}

// ==========================================
// 1. REGISTRATION
// ==========================================
export async function signUpAction(prevState: any, formData: FormData) {
    const validated = SignUpSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { fullName, email, password, ssn } = validated.data;

    try {
        const activeCheck = await prisma.user.findUnique({ where: { email } });
        if (activeCheck) return { globalError: "An account already exists with that email address." };

        const passwordHash = await bcrypt.hash(password, 12);

        let accountNumber = generateAccountNumber();
        let collision = await prisma.user.findUnique({ where: { accountNumber } });
        while (collision) {
            accountNumber = generateAccountNumber();
            collision = await prisma.user.findUnique({ where: { accountNumber } });
        }

        const user = await prisma.user.create({
            data: { fullName, email, passwordHash, ssnEncrypted: ssn, accountNumber }
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

        // Create default accounts for new user
        await prisma.account.createMany({
            data: [
                {
                    accountNumber: `${accountNumber}-CHK`,
                    type: "CHECKING",
                    currency: "USD",
                    balance: 0,
                    userId: user.id,
                },
                {
                    accountNumber: `${accountNumber}-SAV`,
                    type: "SAVINGS",
                    currency: "USD",
                    balance: 0,
                    userId: user.id,
                },
                {
                    accountNumber: `${accountNumber}-INV`,
                    type: "INVESTMENT",
                    currency: "USD",
                    balance: 0,
                    userId: user.id,
                },
            ]
        })

        await sendVerificationEmail(user.email, token.raw, "EMAIL_VERIFICATION");
    } catch (err: any) {
        console.error("[signUpAction]", err);
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        return { globalError: "Something went wrong while creating your account. Please try again." };
    }

    redirect(`/verify-email?target=${encodeURIComponent(email)}`);
}

// ==========================================
// 2. EMAIL VERIFICATION
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
    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        return { globalError: "We couldn't verify your email. Please try again or request a new code." };
    }

    redirect("/dashboard");
}

// ==========================================
// 3. LOGIN
// ==========================================
export async function loginAction(prevState: any, formData: FormData) {
    const validated = LoginSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { email, password } = validated.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return { globalError: "The email or password you entered is incorrect." };

        const matching = await bcrypt.compare(password, user.passwordHash);
        if (!matching) return { globalError: "The email or password you entered is incorrect." };

        if (!user.emailVerified) {
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

        await createSessionToken(user.id, user.role);
    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        return { globalError: "Something went wrong while signing you in. Please try again." };
    }

    redirect("/dashboard");
}

// ==========================================
// 4. FORGOT PASSWORD
// ==========================================
export async function forgotPasswordAction(prevState: any, formData: FormData) {
    const validated = ForgotPasswordSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validated.success) return { error: validated.error.flatten().fieldErrors };

    const { email } = validated.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Stay ambiguous — don't reveal whether the email exists
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
    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        return { globalError: "We couldn't send a reset code right now. Please try again shortly." };
    }

    redirect("/reset-password");
}

// ==========================================
// 5. RESET PASSWORD
// ==========================================
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
    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
        return { globalError: "We couldn't update your password. Please try again or request a new code." };
    }

    redirect("/login?reset=success");
}

// ==========================================
// 6. RESEND OTP
// ==========================================
export async function resendOtpAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const purpose = formData.get("purpose") as string;

    if (!email || !purpose) return { globalError: "Something went wrong. Please refresh and try again." };

    const allowedTypes = ["EMAIL_VERIFICATION", "LOGIN_OTP", "PASSWORD_RESET"] as const;
    type OtpType = typeof allowedTypes[number];
    if (!allowedTypes.includes(purpose as OtpType)) {
        return { globalError: "Something went wrong. Please refresh and try again." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return { success: true }; // stay ambiguous

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
            return { globalError: "A code was just sent. Please wait a minute before requesting another." };
        }

        await prisma.oneTimePassword.updateMany({
            where: { userId: user.id, type: purpose as OtpType, used: false },
            data: { used: true },
        });

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
        return { globalError: "We couldn't send a new code right now. Please try again shortly." };
    }

    return { success: true };
}