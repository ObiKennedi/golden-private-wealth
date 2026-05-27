"use client"

import { RedirectButton } from "../essentials/RedirectButton"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react" // Imported Lucide icons
import "@/styles/landing-page/NavBar.scss"

const NavLinks = [
    { id: 1, link: "#about", label: "About Us" },
    { id: 2, link: "#private-banking", label: "Private Banking" },
    { id: 3, link: "#portfolio", label: "Portfolio" },
    { id: 4, link: "#yield-enhancement", label: "Yield Enhancement" },
    { id: 5, link: "#contact", label: "Contact Us" }
]

const NavBar = () => {
    const [isScrolled, setIsScrolled] = useState<boolean>(false)
    const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
    const router = useRouter()

    useEffect(() => {
        const handleScroll = () => {
            // Fixed scroll state logic to track the viewport window
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    // Close the drawer overlay when a link is clicked
    const handleLinkClick = () => {
        setIsMenuOpen(false)
    }

    return (
        <header className={`nav-bar ${isScrolled ? "scrolled" : ""} ${isMenuOpen ? "menu-active" : ""}`}>
            <img
                src="/logo.png"
                alt="logo"
                onClick={() => { router.push("/"); handleLinkClick(); }}
            />

            {/* Nav container with active toggle for mobile tracking */}
            <nav className={isMenuOpen ? "open" : ""}>
                <ul className="nav-links">
                    {NavLinks.map((link) => (
                        <li key={link.id}>
                            <a href={link.link} onClick={handleLinkClick}>
                                {link.label}
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="nav-cta" onClick={handleLinkClick}>
                    <RedirectButton path="/register">
                        Get Started
                    </RedirectButton>
                </div>
            </nav>

            {/* Hamburger Toggle Button Container */}
            <button
                className="menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle navigation menu"
            >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
        </header>
    )
}

export default NavBar