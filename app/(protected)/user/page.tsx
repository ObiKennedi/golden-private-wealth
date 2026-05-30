import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
    ArrowDownLeft,
    ArrowUpRight,
    ArrowLeftRight,
    Plus,
    Wifi,
    Flame,
    Droplets,
    Phone,
    ShieldCheck,
    Tv2,
    type LucideIcon,
} from "lucide-react";
import { MdElectricBolt } from "react-icons/md";
import { RedirectButton } from "@/components/essentials/RedirectButton";
import "@/styles/user/dashboard.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(val: { toFixed: (n: number) => string } | number, currency = "USD") {
    const n = typeof val === "number" ? val : Number(val);
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(n);
}

function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const TX_ICON: Record<string, LucideIcon> = {
    DEPOSIT: ArrowDownLeft,
    WITHDRAWAL: ArrowUpRight,
    TRANSFER: ArrowLeftRight,
    YIELD_PAYOUT: ArrowDownLeft,
    ASSET_PURCHASE: ArrowUpRight,
    ASSET_SALE: ArrowDownLeft,
};

const TX_COLOR: Record<string, string> = {
    DEPOSIT: "tx--credit",
    YIELD_PAYOUT: "tx--credit",
    ASSET_SALE: "tx--credit",
    WITHDRAWAL: "tx--debit",
    TRANSFER: "tx--neutral",
    ASSET_PURCHASE: "tx--debit",
};

const UTILITIES = [
    { label: "Internet", Icon: Wifi, source: "lucide" },
    { label: "Electricity", Icon: MdElectricBolt, source: "react-icons" },
    { label: "Gas", Icon: Flame, source: "lucide" },
    { label: "Water", Icon: Droplets, source: "lucide" },
    { label: "Mobile", Icon: Phone, source: "lucide" },
    { label: "Insurance", Icon: ShieldCheck, source: "lucide" },
    { label: "Cable TV", Icon: Tv2, source: "lucide" },
];

// ── Page ────────────────────────────────────────────────────────────────────

export default async function UserHomePage() {
    // Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    let userId: string;
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId as string;
    } catch {
        redirect("/login");
    }

    // Data
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            accounts: true,
        },
    });

    if (!user) redirect("/login");

    const checking = user.accounts.find(a => a.type === "CHECKING");
    const savings = user.accounts.find(a => a.type === "SAVINGS");
    const invest = user.accounts.find(a => a.type === "INVESTMENT");
    const credit = user.accounts.find(a => a.type === "CREDIT");

    // Last 5 transactions across all accounts
    const accountIds = user.accounts.map(a => a.id);
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { senderAccountId: { in: accountIds } },
                { receiverAccountId: { in: accountIds } },
            ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    const firstName = user.fullName.split(" ")[0];
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="dash">

            {/* ── Header ── */}
            <header className="dash__header">
                <div className="dash__greeting">
                    <p className="dash__greeting-sub">{greeting}</p>
                    <h1 className="dash__greeting-name">{firstName}</h1>
                </div>
                <div className="dash__header-meta">
                    <div className="dash__tx-badge">
                        <span className="dash__tx-badge-label">Total Transactions</span>
                        <span className="dash__tx-badge-count">{transactions.length}</span>
                    </div>
                </div>
            </header>

            {/* ── Balance Card ── */}
            <section className="dash__balance-card" aria-label="Account balances">
                <div className="dash__balance-primary">
                    <span className="dash__balance-label">Checking Balance</span>
                    <span className="dash__balance-amount">
                        {checking ? fmt(checking.balance, checking.currency) : "—"}
                    </span>
                    {checking && (
                        <span className="dash__balance-acct">
                            •••• {checking.accountNumber.slice(-4)}
                        </span>
                    )}
                </div>

                <div className="dash__balance-secondary">
                    {[
                        { label: "Savings", account: savings },
                        { label: "Investment", account: invest },
                        { label: "Credit", account: credit },
                    ].map(({ label, account }) => (
                        <div key={label} className="dash__balance-sub">
                            <span className="dash__balance-sub-label">{label}</span>
                            <span className="dash__balance-sub-amount">
                                {account ? fmt(account.balance, account.currency) : "—"}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Actions ── */}
            <div className="dash__actions">
                <RedirectButton
                    className="dash__action-btn dash__action-btn--primary"
                    path="/user/fund"
                >
                    <Plus size={16} aria-hidden="true" />
                    Fund Account
                </RedirectButton>
                <RedirectButton
                    className="dash__action-btn dash__action-btn--ghost"
                    path="/user/transfer"
                >
                    <ArrowLeftRight size={16} aria-hidden="true" />
                    Transfer
                </RedirectButton>
            </div>

            {/* ── Recent Transactions ── */}
            <section className="dash__section" aria-label="Recent transactions">
                <h2 className="dash__section-title">Recent Activity</h2>

                {transactions.length === 0 ? (
                    <p className="dash__empty">No transactions yet.</p>
                ) : (
                    <ul className="dash__tx-list" role="list">
                        {transactions.map(tx => {
                            const Icon = TX_ICON[tx.type] ?? ArrowLeftRight;
                            const color = TX_COLOR[tx.type] ?? "tx--neutral";
                            const isCredit = ["DEPOSIT", "YIELD_PAYOUT", "ASSET_SALE"].includes(tx.type);

                            return (
                                <li key={tx.id} className="dash__tx-item">
                                    <div className={`dash__tx-icon ${color}`}>
                                        <Icon size={15} aria-hidden="true" />
                                    </div>
                                    <div className="dash__tx-info">
                                        <span className="dash__tx-desc">
                                            {tx.description ?? tx.type.replace(/_/g, " ")}
                                        </span>
                                        <span className="dash__tx-meta">
                                            {tx.status} · {timeAgo(tx.createdAt)}
                                        </span>
                                    </div>
                                    <span className={`dash__tx-amount ${isCredit ? "dash__tx-amount--credit" : "dash__tx-amount--debit"}`}>
                                        {isCredit ? "+" : "−"}{fmt(tx.amount, tx.currency)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* ── Utilities ── */}
            <section className="dash__section" aria-label="Utility payments">
                <h2 className="dash__section-title">Pay Utilities</h2>
                <div className="dash__utilities">
                    {UTILITIES.map(({ label, Icon }) => (
                        <button key={label} className="dash__utility-item">
                            <span className="dash__utility-icon">
                                <Icon size={20} aria-hidden="true" />
                            </span>
                            <span className="dash__utility-label">{label}</span>
                        </button>
                    ))}
                </div>
            </section>

        </div>
    );
}