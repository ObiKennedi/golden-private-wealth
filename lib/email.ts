import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? "Golden Private Wealth <noreply@goldenprivatewealth.com>";

const BRAND_STYLES = `
  font-family: Georgia, 'Times New Roman', serif;
`;

function formatGBP(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
}

function buildEmailShell(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#090e1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#090e1a;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#0d1120;border:1px solid rgba(196,149,32,0.25);border-radius:2px;">
        <!-- Header -->
        <tr>
          <td style="padding:28px 36px 20px;border-bottom:1px solid rgba(196,149,32,0.15);">
            <p style="margin:0;font-family:Georgia,serif;font-size:10px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#c49520;">
              Golden Private Wealth Bank
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 36px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 36px 28px;border-top:1px solid rgba(196,149,32,0.1);">
            <p style="margin:0;font-size:11px;color:rgba(216,220,232,0.3);line-height:1.6;">
              This communication is intended solely for the named recipient.<br/>
              Golden Private Wealth Bank &middot; 11 Wall Street, New York, NY 10005
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function statusBadge(status: "COMPLETED" | "PENDING" | "REJECTED" | "REVERSED"): string {
  const colours: Record<string, string> = {
    COMPLETED: "#16a34a",
    PENDING: "#ca8a04",
    REJECTED: "#dc2626",
    REVERSED: "#7c3aed",
  };
  const bg = colours[status] ?? "#6b7280";
  return `<span style="display:inline-block;padding:3px 10px;border-radius:2px;background:${bg};color:#fff;font-size:11px;font-weight:700;letter-spacing:0.08em;">${status}</span>`;
}

function row(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid rgba(196,149,32,0.08);font-size:12px;color:rgba(216,220,232,0.5);width:40%;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid rgba(196,149,32,0.08);font-size:13px;color:#d8dce8;text-align:right;">${value}</td>
  </tr>`;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export interface TransferNotificationParams {
  to: string;
  userName: string;
  reference: string;
  amount: number;
  recipientName: string;
  recipientBank: string;
  status: "COMPLETED" | "PENDING" | "REJECTED" | "REVERSED";
  note?: string | null;
  date?: Date;
}

export async function sendTransferNotificationEmail(params: TransferNotificationParams) {
  const { to, userName, reference, amount, recipientName, recipientBank, status, note, date } = params;

  const isInternal = recipientBank === "GOLDEN_PRIVATE_WEALTH";
  const bankLabel = isInternal ? "Golden Private Wealth (Internal)" : recipientBank.replace(/_/g, " ");
  const dateLabel = (date ?? new Date()).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
  });

  const subjectMap: Record<string, string> = {
    COMPLETED: `Transfer Confirmed — ${reference}`,
    PENDING: `Transfer Submitted — ${reference}`,
    REJECTED: `Transfer Declined — ${reference}`,
    REVERSED: `Transfer Reversed — ${reference}`,
  };

  const headlineMap: Record<string, string> = {
    COMPLETED: "Your transfer has been processed.",
    PENDING: "Your transfer is under review.",
    REJECTED: "Your transfer was declined.",
    REVERSED: "Your transfer has been reversed.",
  };

  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#fdf6e3;letter-spacing:-0.01em;">
      ${headlineMap[status]}
    </h2>
    <p style="margin:0 0 28px;font-size:14px;color:rgba(216,220,232,0.6);">Hello ${userName},</p>

    <div style="background:rgba(196,149,32,0.06);border:1px solid rgba(196,149,32,0.2);border-radius:2px;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(216,220,232,0.45);">Amount</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:32px;color:#f0d068;font-weight:700;">${formatGBP(amount)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row("Status", statusBadge(status))}
      ${row("Reference", `<code style="font-size:11px;color:#c49520;">${reference}</code>`)}
      ${row("Recipient", recipientName)}
      ${row("Destination Bank", bankLabel)}
      ${note ? row("Note", note) : ""}
      ${row("Date", dateLabel)}
    </table>

    <p style="font-size:13px;color:rgba(216,220,232,0.5);line-height:1.7;margin:0;">
      If you did not authorise this transaction, please contact our support team immediately.
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: subjectMap[status],
      html: buildEmailShell(body),
    });

    if (error) {
      console.error("[sendTransferNotificationEmail] Resend error:", error);
    }
  } catch (err) {
    console.error("[sendTransferNotificationEmail] Unexpected error:", err);
  }
}

// ── Savings Lock notification ──────────────────────────────────────────────────

export interface SavingsLockNotificationParams {
  to: string;
  userName: string;
  amount: number;
  lockDays: number;
  projectedInterest: number;
  projectedTotal: number;
  unlocksAt: Date;
  referenceId: string;
  type: "LOCKED" | "WITHDRAWAL_REQUESTED" | "WITHDRAWAL_APPROVED" | "WITHDRAWAL_REJECTED";
}

export async function sendSavingsNotificationEmail(params: SavingsLockNotificationParams) {
  const { to, userName, amount, lockDays, projectedInterest, projectedTotal, unlocksAt, referenceId, type } = params;

  const subjectMap: Record<string, string> = {
    LOCKED: `Savings Lock Confirmed — ${referenceId.slice(0, 12).toUpperCase()}`,
    WITHDRAWAL_REQUESTED: `Withdrawal Request Submitted — ${referenceId.slice(0, 12).toUpperCase()}`,
    WITHDRAWAL_APPROVED: `Savings Withdrawal Approved — ${referenceId.slice(0, 12).toUpperCase()}`,
    WITHDRAWAL_REJECTED: `Savings Withdrawal Declined — ${referenceId.slice(0, 12).toUpperCase()}`,
  };

  const headlineMap: Record<string, string> = {
    LOCKED: "Your savings have been locked.",
    WITHDRAWAL_REQUESTED: "Your withdrawal request is pending.",
    WITHDRAWAL_APPROVED: "Your savings withdrawal has been approved.",
    WITHDRAWAL_REJECTED: "Your savings withdrawal was declined.",
  };

  const unlockLabel = unlocksAt.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/London",
  });

  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#fdf6e3;letter-spacing:-0.01em;">
      ${headlineMap[type]}
    </h2>
    <p style="margin:0 0 28px;font-size:14px;color:rgba(216,220,232,0.6);">Hello ${userName},</p>

    <div style="background:rgba(196,149,32,0.06);border:1px solid rgba(196,149,32,0.2);border-radius:2px;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(216,220,232,0.45);">Principal Locked</p>
      <p style="margin:0;font-family:Georgia,serif;font-size:32px;color:#f0d068;font-weight:700;">${formatGBP(amount)}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${row("Lock Duration", `${lockDays} days`)}
      ${row("Matures On", unlockLabel)}
      ${row("Interest (1%/day)", formatGBP(projectedInterest))}
      ${row("Projected Payout", formatGBP(projectedTotal))}
      ${row("Reference", `<code style="font-size:11px;color:#c49520;">${referenceId.slice(0, 16).toUpperCase()}</code>`)}
    </table>

    <p style="font-size:13px;color:rgba(216,220,232,0.5);line-height:1.7;margin:0;">
      If you did not authorise this action, please contact our support team immediately.
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: subjectMap[type],
      html: buildEmailShell(body),
    });

    if (error) {
      console.error("[sendSavingsNotificationEmail] Resend error:", error);
    }
  } catch (err) {
    console.error("[sendSavingsNotificationEmail] Unexpected error:", err);
  }
}

// ── Account Restriction notification ─────────────────────────────────────────

export async function sendAccountRestrictedEmail(params: { to: string; userName: string }) {
  const { to, userName } = params;

  const body = `
    <h2 style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#fdf6e3;letter-spacing:-0.01em;">
      Action required on your account.
    </h2>
    <p style="margin:0 0 28px;font-size:14px;color:rgba(216,220,232,0.6);">Hello ${userName},</p>

    <div style="background:rgba(220,38,38,0.08);border:1px solid rgba(220,38,38,0.35);border-radius:2px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(220,38,38,0.8);font-weight:700;">Account Restricted</p>
      <p style="margin:0;font-size:14px;color:rgba(216,220,232,0.8);line-height:1.7;">
        Outgoing transactions from your Golden Private Wealth account have been temporarily restricted
        by our compliance team. You will not be able to initiate any transfers until the restriction is lifted.
      </p>
    </div>

    <p style="font-size:14px;color:rgba(216,220,232,0.7);line-height:1.7;margin:0 0 20px;">
      If you believe this is an error, or to resolve this matter, please contact our Customer Service team immediately:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(196,149,32,0.08);font-size:12px;color:rgba(216,220,232,0.5);width:40%;">Email</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(196,149,32,0.08);font-size:13px;color:#d8dce8;text-align:right;">support@goldenprivatewealth.com</td>
      </tr>
      <tr>
        <td style="padding:12px 0;font-size:12px;color:rgba(216,220,232,0.5);">Phone</td>
        <td style="padding:12px 0;font-size:13px;color:#d8dce8;text-align:right;">+44 (0)20 7000 0000</td>
      </tr>
    </table>

    <p style="font-size:12px;color:rgba(216,220,232,0.4);line-height:1.7;margin:0;">
      Please have your account number and government-issued identification available when you contact us.
      Our team is available Monday – Friday, 09:00 – 17:30 GMT.
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Important: Your Account Has Been Restricted",
      html: buildEmailShell(body),
    });

    if (error) {
      console.error("[sendAccountRestrictedEmail] Resend error:", error);
    }
  } catch (err) {
    console.error("[sendAccountRestrictedEmail] Unexpected error:", err);
  }
}
