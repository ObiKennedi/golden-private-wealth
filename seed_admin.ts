import { prisma } from "./lib/db"
import bcrypt from "bcrypt"

async function main() {
    const passwordHash = await bcrypt.hash(process.env.AdminPassword || "Admin123!", 12)
    await prisma.user.create({
        data: {
            fullName: "Admin User",
            email: "contact@goldenprivatewealth.com",
            passwordHash,
            ssn: "111-22-3333",
            accountNumber: "GPW0000000000",
            role: "ADMIN",
            emailVerified: true,
            status: "ACTIVE",
            accounts: {
                create: [
                    { accountNumber: "GPW0000000000-CHK", type: "CHECKING", balance: 1000000 }
                ]
            }
        }
    })
    console.log("Admin seeded.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
