import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import "@/styles/admin/nav-layout.scss";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // Guard — only ADMINs may enter
    const cookieStore = await cookies();
    const token = cookieStore.get("golden_session")?.value;
    if (!token) redirect("/login");

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role !== "ADMIN") redirect("/user/home");
    } catch {
        redirect("/login");
    }

    return (
        <div className="admin-layout">
            <AdminNav />
            <div className="admin-layout__main">
                <div className="admin-layout__topbar" aria-hidden="true" />
                <div className="admin-layout__content">
                    {children}
                </div>
            </div>
        </div>
    );
}