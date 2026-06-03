/**
 * Run this once to migrate all existing USD currency records to GBP.
 * Usage: npx tsx scripts/migrate-currency.ts
 */
import { prisma } from "../lib/db";

async function main() {
    console.log("Updating Account currency USD → GBP…");
    const accounts = await prisma.account.updateMany({
        where: { currency: "USD" },
        data: { currency: "GBP" },
    });
    console.log(`  ✓ ${accounts.count} accounts updated`);

    console.log("Updating Transaction currency USD → GBP…");
    const transactions = await prisma.transaction.updateMany({
        where: { currency: "USD" },
        data: { currency: "GBP" },
    });
    console.log(`  ✓ ${transactions.count} transactions updated`);

    console.log("Updating Transfer currency USD → GBP…");
    const transfers = await prisma.transfer.updateMany({
        where: { currency: "USD" },
        data: { currency: "GBP" },
    });
    console.log(`  ✓ ${transfers.count} transfers updated`);

    console.log("Updating Loan currency USD → GBP…");
    const loans = await prisma.loan.updateMany({
        where: { currency: "USD" },
        data: { currency: "GBP" },
    });
    console.log(`  ✓ ${loans.count} loans updated`);

    console.log("\n✅ All done — all USD records are now GBP.");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
