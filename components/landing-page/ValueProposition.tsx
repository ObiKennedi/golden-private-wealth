"use client"

import "@/styles/landing-page/ValueProposition.scss"
import { useEffect } from "react"
import Aos from "aos"
import "aos/dist/aos.css"

const pillars = [
    {
        id: 1,
        number: "01",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M24 4L44 14V26C44 35.9 35.1 44.3 24 47C12.9 44.3 4 35.9 4 26V14L24 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M16 24L21 29L32 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        headline: "Absolute Discretion",
        body: "Every client relationship is governed by ironclad confidentiality protocols built to American private banking standards. Your financial architecture is known only to those you explicitly authorize.",
        stat: "100%",
        statLabel: "Client Confidentiality Guarantee",
    },
    {
        id: 2,
        number: "02",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="1.5" />
                <path d="M24 14V24L30 30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 24H6M42 24H40M24 8V6M24 42V40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        headline: "Generational Time Horizon",
        body: "We measure success in decades, not quarters. Our multi-generational wealth planning frameworks are architected to compound prosperity well beyond the current generation — from estate structuring to dynasty trust formation.",
        stat: "3×",
        statLabel: "Average Generational Wealth Transfer",
    },
    {
        id: 3,
        number: "03",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="6" y="14" width="36" height="26" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 20H42" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 8L24 4L32 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 30H22M26 30H31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        headline: "Institutional-Grade Vaults",
        body: "Assets under our custody are protected by cryptographic-layer architecture, FDIC-backed reserves, and a proprietary multi-jurisdictional vault system exceeding all U.S. federal depository security mandates.",
        stat: "$2.4B+",
        statLabel: "Assets Under Management",
    },
    {
        id: 4,
        number: "04",
        icon: (
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M10 36L20 26L26 32L38 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="38" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 42H42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
        headline: "Predictive Risk Modeling",
        body: "Proprietary algorithmic risk intelligence continuously monitors over 140 global market variables in real time — rebalancing your portfolio before volatility materializes, not after.",
        stat: "140+",
        statLabel: "Market Variables Monitored 24/7",
    },
]

const differentiators = [
    { label: "Minimum AUM", value: "$5M" },
    { label: "Dedicated Advisors", value: "1:1" },
    { label: "Founded", value: "1987" },
    { label: "FDIC Insured", value: "Yes" },
    { label: "ESG Compliant", value: "100%" },
    { label: "U.S. Regulated", value: "SEC / FINRA" },
]

export const ValueProposition = () => {
    useEffect(() => {
        Aos.init({ duration: 900, once: true, easing: "ease-out-cubic" })
    }, [])

    return (
        <section className="value-prop" id="why-choose-us">

            {/* ── Background ornament ── */}
            <div className="value-prop__ornament" aria-hidden="true">
                <span>GOLDEN</span>
            </div>

            {/* ── Header ── */}
            <div className="value-prop__header" data-aos="fade-up">
                <p className="value-prop__eyebrow">Why Golden Private Wealth Bank</p>
                <h2>
                    The Standard of American<br />
                    <em>Private Wealth Management.</em>
                </h2>
                <p className="value-prop__sub">
                    Four decades of disciplined stewardship. One unwavering commitment —
                    to protect and grow the fortunes of America's most distinguished families and institutions.
                </p>
            </div>

            {/* ── Pillars grid ── */}
            <div className="value-prop__pillars">
                {pillars.map((pillar, i) => (
                    <article
                        key={pillar.id}
                        className="pillar-card"
                        data-aos="fade-up"
                        data-aos-delay={i * 100}
                    >
                        <div className="pillar-card__number">{pillar.number}</div>
                        <div className="pillar-card__icon">{pillar.icon}</div>
                        <h3 className="pillar-card__headline">{pillar.headline}</h3>
                        <p className="pillar-card__body">{pillar.body}</p>
                        <div className="pillar-card__stat">
                            <span className="pillar-card__stat-value">{pillar.stat}</span>
                            <span className="pillar-card__stat-label">{pillar.statLabel}</span>
                        </div>
                    </article>
                ))}
            </div>

            {/* ── Differentiator strip ── */}
            <div className="value-prop__strip" data-aos="fade-up" data-aos-delay="200">
                {differentiators.map((item) => (
                    <div key={item.label} className="strip-item">
                        <span className="strip-item__value">{item.value}</span>
                        <span className="strip-item__label">{item.label}</span>
                    </div>
                ))}
            </div>

        </section>
    )
}