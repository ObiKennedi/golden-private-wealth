import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminAuditClient from "@/components/admin/AdminAuditClient";
import "@/styles/admin/audit.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export default async function AdminAuditPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
    } catch {
        redirect("/login");
    }

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 500,
        include: {
            user: {
                select: { fullName: true, email: true, role: true },
            },
        },
    });

    const totalCount = await prisma.auditLog.count();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } });
    const uniqueActors = await prisma.auditLog.groupBy({ by: ["userId"], where: { userId: { not: null } } });

    const serialized = logs.map(l => ({
        id: l.id,
        action: l.action,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        metadata: l.metadata ? JSON.stringify(l.metadata) : null,
        createdAt: l.createdAt.toISOString(),
        user: l.user ? {
            fullName: l.user.fullName,
            email: l.user.email,
            role: l.user.role,
        } : null,
    }));

    return (
        <AdminAuditClient
            logs={serialized}
            totalCount={totalCount}
            todayCount={todayCount}
            uniqueActors={uniqueActors.length}
        />
    );
}