"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
    LayoutDashboard,
    Users,
    ArrowLeftRight,
    Landmark,
    ShieldCheck,
    Settings,
    FileText,
    Send,
    Menu,
    X,
    LogOut,
    type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/actions/profile";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/admin/transfers", label: "Transfers", icon: Send },
    { href: "/admin/loans", label: "Loans", icon: Landmark },
    { href: "/admin/audit", label: "Audit Log", icon: FileText },
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminNav() {
    const pathname = usePathname();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Close drawer on route change
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    // Prevent body scroll when drawer open on mobile
    useEffect(() => {
        if (drawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [drawerOpen]);

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin" || pathname === "/admin/home";
        return pathname.startsWith(href);
    };

    const handleSignOut = () => startTransition(async () => { await signOutAction(); });

    const NavContent = () => (
        <>
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
                            onClick={() => setDrawerOpen(false)}
                        >
                            <Icon className="admin-side-nav__icon" size={18} aria-hidden="true" />
                            <span className="admin-side-nav__label">{label}</span>
                            {isActive(href) && <span className="admin-side-nav__pip" aria-hidden="true" />}
                        </Link>
                    </li>
                ))}
            </ul>

            {/* Sign-out button above footer */}
            <button
                className="admin-side-nav__signout"
                onClick={handleSignOut}
                disabled={isPending}
                aria-label="Sign out"
            >
                <LogOut size={16} aria-hidden="true" />
                <span>{isPending ? "Signing out…" : "Sign Out"}</span>
            </button>

            <div className="admin-side-nav__footer">
                <span className="admin-side-nav__footer-badge">Admin</span>
                <span className="admin-side-nav__footer-text">Golden Private Wealth</span>
            </div>
        </>
    );

    return (
        <>
            {/* ── Hamburger topbar — mobile only ── */}
            <div className="admin-mobile-topbar" aria-label="Admin mobile header">
                <span className="admin-mobile-topbar__wordmark">GPW</span>
                <button
                    className="admin-mobile-topbar__hamburger"
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Open navigation menu"
                    aria-expanded={drawerOpen}
                >
                    <Menu size={22} />
                </button>
            </div>

            {/* ── Overlay backdrop — mobile only ── */}
            {drawerOpen && (
                <div
                    className="admin-drawer-overlay"
                    onClick={() => setDrawerOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ── Side Nav — desktop always visible; mobile = drawer ── */}
            <nav
                className={`admin-side-nav${drawerOpen ? " admin-side-nav--open" : ""}`}
                aria-label="Admin navigation"
            >
                {/* Close button — only visible inside drawer on mobile */}
                <button
                    className="admin-side-nav__close"
                    onClick={() => setDrawerOpen(false)}
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>

                <NavContent />
            </nav>
        </>
    );
}