import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateAndHashOtp(): { raw: string; hashed: string } {
  const raw = crypto.randomInt(100000, 1000000).toString();
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hashed };
}

export async function sendVerificationEmail(email: string, code: string, purpose: string) {
  const subjectMap: Record<string, string> = {
    EMAIL_VERIFICATION: "Verify Your Email Address",
    LOGIN_OTP: "Your Login Verification Code",
    PASSWORD_RESET: "Password Reset Code",
  };

  const subject = subjectMap[purpose] ?? "Your Verification Code";

  const { error } = await resend.emails.send({
    from: "Golden Private Wealth Bank <noreply@goldenprivatewealth.com>",
    to: email,
    subject,
    html: `
            <div style="font-family:sans-serif;background:#0d1120;color:#d8dce8;padding:40px;max-width:480px;margin:0 auto;border:1px solid rgba(196,149,32,0.3);">
                <p style="font-family:Georgia,serif;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:#c49520;margin:0 0 24px;">
                    Golden Private Wealth Bank
                </p>
                <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:400;color:#fdf6e3;margin:0 0 16px;letter-spacing:-0.01em;">
                    ${subject}
                </h2>
                <p style="font-size:14px;line-height:1.7;color:rgba(216,220,232,0.7);margin:0 0 32px;">
                    Use the code below to complete your request. It expires in 15 minutes.
                    If you did not initiate this, disregard this message.
                </p>
                <div style="background:rgba(196,149,32,0.08);border:1px solid rgba(196,149,32,0.35);padding:24px;text-align:center;margin:0 0 32px;">
                    <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:0.3em;color:#f0d068;">
                        ${code}
                    </span>
                </div>
                <p style="font-size:11px;color:rgba(216,220,232,0.3);margin:0;line-height:1.6;border-top:1px solid rgba(196,149,32,0.1);padding-top:24px;">
                    This communication is intended solely for the named recipient.
                    Golden Private Wealth Bank · 11 Wall Street, New York, NY 10005
                </p>
            </div>
        `,
  });

  if (error) {
    console.error("[sendVerificationEmail] Resend error:", error);
    throw new Error(`Email dispatch failed: ${error.message}`);
  }
}