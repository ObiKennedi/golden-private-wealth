"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Landmark, TrendingUp, UserCircle, type LucideIcon } from "lucide-react";
import "@/styles/user/Nav.scss";

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
    { href: "/user", label: "Dashboard", icon: LayoutDashboard },
    { href: "/user/transactions", label: "Transactions", icon: ArrowLeftRight },
    { href: "/user/loans", label: "Loans", icon: Landmark },
    { href: "/user/assets", label: "Assets", icon: TrendingUp },
    { href: "/user/profile", label: "Profile", icon: UserCircle },
];

export default function Nav() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/user") return pathname === "/user" || pathname === "/user/home";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Side Nav — desktop */}
            <nav className="side-nav" aria-label="Main navigation">
                <div className="side-nav__brand">
                    <span className="side-nav__wordmark">GPW</span>
                    <span className="side-nav__wordmark-sub">Private Wealth</span>
                </div>

                <ul className="side-nav__list" role="list">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <li key={href}>
                            <Link
                                href={href}
                                className={`side-nav__item ${isActive(href) ? "side-nav__item--active" : ""}`}
                                aria-current={isActive(href) ? "page" : undefined}
                            >
                                <Icon className="side-nav__icon" size={18} aria-hidden="true" />
                                <span className="side-nav__label">{label}</span>
                                {isActive(href) && <span className="side-nav__pip" aria-hidden="true" />}
                            </Link>
                        </li>
                    ))}
                </ul>

                <div className="side-nav__footer">
                    <span className="side-nav__footer-text">Golden Private Wealth</span>
                </div>
            </nav>

            {/* Foot Nav — mobile */}
            <nav className="foot-nav" aria-label="Mobile navigation">
                <ul className="foot-nav__list" role="list">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <li key={href} className="foot-nav__item">
                            <Link
                                href={href}
                                className={`foot-nav__link ${isActive(href) ? "foot-nav__link--active" : ""}`}
                                aria-current={isActive(href) ? "page" : undefined}
                            >
                                <Icon className="foot-nav__icon" size={22} aria-hidden="true" />
                                <span className="foot-nav__label">{label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}