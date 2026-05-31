import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AssetsClient } from "@/components/user/AssetsClient";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export default async function AssetsPage() {
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

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            accounts: true,
            loans: {
                where: { status: { in: ["ACTIVE", "APPROVED", "PENDING", "UNDER_REVIEW"] } },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!user) redirect("/login");

    const totalBalance = user.accounts.reduce((s, a) => s + Number(a.balance), 0);
    const totalLoanExposure = user.loans
        .filter(l => ["ACTIVE", "APPROVED"].includes(l.status))
        .reduce((s, l) => s + Number(l.principalAmount), 0);
    const netWorth = totalBalance - totalLoanExposure;

    const serializedAccounts = user.accounts.map(acct => ({
        ...acct,
        balance: Number(acct.balance),
        createdAt: acct.createdAt.toISOString(),
        updatedAt: acct.updatedAt.toISOString(),
    }));

    const serializedLoans = user.loans.map(loan => ({
        ...loan,
        principalAmount: Number(loan.principalAmount),
        interestRate: Number(loan.interestRate),
        monthlyPayment: loan.monthlyPayment ? Number(loan.monthlyPayment) : null,
        createdAt: loan.createdAt.toISOString(),
        updatedAt: loan.updatedAt.toISOString(),
        approvedAt: loan.approvedAt ? loan.approvedAt.toISOString() : null,
        rejectedAt: loan.rejectedAt ? loan.rejectedAt.toISOString() : null,
        closedAt: loan.closedAt ? loan.closedAt.toISOString() : null,
    }));

    return (
        <AssetsClient
            accounts={serializedAccounts as any}
            loans={serializedLoans as any}
            netWorth={netWorth}
            totalBalance={totalBalance}
            totalLoanExposure={totalLoanExposure}
        />
    );
}