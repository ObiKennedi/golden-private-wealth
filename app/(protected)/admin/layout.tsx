// @ts-nocheck

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export default async function AdminLayout({
    children
}: {
    children: React.ReactNode;
}) {
    const headerList = await headers();
    const token = headerList.get("cookie")?.replace("golden_session=", "");

    if (!token) {
        redirect("/login");
    }

    let payload;
    try {
        const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
        payload = jwtPayload;
    } catch {
        redirect("/login");
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.userId as string }
    });

    if (!user) {
        redirect("/login");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    return <>{children}</>;
}