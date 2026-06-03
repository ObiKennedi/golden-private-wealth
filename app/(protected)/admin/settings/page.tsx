import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminSettingsClient from "@/components/admin/AdminSettingsClient";
import "@/styles/admin/settings.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export default async function AdminSettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    let adminId: string;
    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
        adminId = payload.userId as string;
    } catch {
        redirect("/login");
    }

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin) redirect("/login");

    const nameParts = admin.fullName.trim().split(" ");
    const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : admin.fullName.slice(0, 2).toUpperCase();

    const memberSince = new Intl.DateTimeFormat("en-GB", {
        month: "long",
        year: "numeric",
    }).format(admin.createdAt);

    return (
        <div className="settingspage">
            <AdminSettingsClient
                userId={admin.id}
                fullName={admin.fullName}
                email={admin.email}
                avatarUrl={admin.avatarUrl ?? null}
                initials={initials}
                memberSince={memberSince}
                emailVerified={admin.emailVerified}
                createdAt={admin.createdAt.toISOString()}
            />
        </div>
    );
}