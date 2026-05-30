import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import ProfileClient from "@/components/user/ProfileClient"
import "@/styles/user/profile.scss"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

function maskSSN(ssn: string): string {
    const digits = ssn.replace(/-/g, "")
    if (digits.length !== 9) return "***-**-****"
    return `${digits.slice(0, 3)}-**-**${digits.slice(7)}`
}

export default async function ProfilePage() {
    const cookieStore = await cookies()
    const token = cookieStore.get("golden_session")?.value
    if (!token) redirect("/login")

    let userId: string
    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET)
        userId = payload.userId as string
    } catch {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) redirect("/login")

    const nameParts = user.fullName.trim().split(" ")
    const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : user.fullName.slice(0, 2).toUpperCase()

    const memberSince = new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
    }).format(user.createdAt)

    return (
        <div className="profilepage">
            <ProfileClient
                userId={user.id}
                fullName={user.fullName}
                email={user.email}
                accountNumber={user.accountNumber}
                maskedSSN={maskSSN(user.ssnEncrypted)}
                role={user.role}
                avatarUrl={user.avatarUrl ?? null}
                initials={initials}
                memberSince={memberSince}
                emailVerified={user.emailVerified}
            />
        </div>
    )
}