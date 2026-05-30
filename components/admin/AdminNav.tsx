"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    ArrowLeftRight,
    Landmark,
    ShieldCheck,
    Settings,
    FileText,
    type LucideIcon,
} from "lucide-react";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/admin/loans", label: "Loans", icon: Landmark },
    { href: "/admin/audit", label: "Audit Log", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminNav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin" || pathname === "/admin/home";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Side Nav — desktop */}
            <nav className="admin-side-nav" aria-label="Admin navigation">
                <div className="admin-side-nav__brand">
                    <span className="admin-side-nav__wordmark">GPW</span>
                    <span className="admin-side-nav__wordmark-sub">Admin Console</span>
                </div>

                <ul className="admin-side-nav__list" role="list">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className={`admin-side-nav__item ${isActive(href) ? "admin-side-nav__item--active" : ""}`}
                                aria-current={isActive(href) ? "page" : undefined}
                            >
                                <Icon className="admin-side-nav__icon" size={18} aria-hidden="true" />
                                <span className="admin-side-nav__label">{label}</span>
                                {isActive(href) && <span className="admin-side-nav__pip" aria-hidden="true" />}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="admin-side-nav__footer">
                    <span className="admin-side-nav__footer-badge">Admin</span>
                    <span className="admin-side-nav__footer-text">Golden Private Wealth</span>
                </div>
            </nav>

            {/* Foot Nav — mobile */}
            <nav className="admin-foot-nav" aria-label="Admin mobile navigation">
                <ul className="admin-foot-nav__list" role="list">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <li key={href} className="admin-foot-nav__item">
                            <Link
                                href={href}
                                className={`admin-foot-nav__link ${isActive(href) ? "admin-foot-nav__link--active" : ""}`}
                                aria-current={isActive(href) ? "page" : undefined}
                            >
                                <Icon className="admin-foot-nav__icon" size={20} aria-hidden="true" />
                                <span className="admin-foot-nav__label">{label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}