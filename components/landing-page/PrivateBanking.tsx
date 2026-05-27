"use client"

import "@/styles/landing-page/PrivateBanking.scss"
import { useEffect } from "react"
import Aos from "aos"
import "aos/dist/aos.css"

export const PrivateBanking = () => {
    useEffect(() => {
        Aos.init({ duration: 900, once: true, easing: "ease-out-cubic" })
    }, [])
    return (
        <section className="private-banking-section" id="private-banking">
            <div className="section-header" data-aos="fade-up" data-aos-delay="200">
                <h2>Private Banking, Redefined</h2>
                <p>Bespoke capital engineering designed around your global lifestyle.</p>
            </div>

            <div className="banking-grid">
                <div className="banking-card">
                    <h3>Bespoke Liquidity</h3>
                    <p>Access multi-currency capital architecture, Lombard lending, and tailored asset-backed financing tailored to fluid market positions.</p>
                </div>
                <div className="banking-card">
                    <h3>Sovereign Card Access</h3>
                    <p>Our invite-only physical assets provide infinite cross-border spending, elite global terminal lounges, and 24/7 dedicated lifestyle curation.</p>
                </div>
                <div className="banking-card">
                    <h3>Dedicated Custodianship</h3>
                    <p>Bypass the noise with a single, direct point of contact backed by an elite inner circle of international tax, legal, and risk advisors.</p>
                </div>
            </div>
        </section>
    )
}