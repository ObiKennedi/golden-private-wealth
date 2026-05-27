"use client"

import {
    LineChart,
    ShieldCheck,
    Compass,
    Layers,
} from 'lucide-react';
import { useEffect } from 'react';
import Aos from 'aos';
import 'aos/dist/aos.css';
import "@/styles/landing-page/Portfolio.scss"

export const PortfolioSection = () => {
    useEffect(() => {
        Aos.init({ duration: 900, once: true, easing: "ease-out-cubic" })
    }, [])

    const strategicOfferings = [
        {
            icon: <LineChart size={24} />,
            title: "Discretionary Mandates",
            description: "Entrust your capital to our absolute management framework. We execute precise macro-allocation strategies based on real-time market intelligence, allowing you to preserve wealth without operational friction."
        },
        {
            icon: <Compass size={24} />,
            title: "Bespoke Advisory",
            description: "Maintain ultimate execution authority while capitalizing on our institutional research network. Receive tailored, sovereign-level insights explicitly curated for your specific risk matrix."
        },
        {
            icon: <ShieldCheck size={24} />,
            title: "Capital Preservation Architectures",
            description: "Custom hedging algorithms, physical asset integration, and structural short-positions designed to immunize your core multi-generational wealth against aggressive inflationary cycles."
        },
        {
            icon: <Layers size={24} />,
            title: "Alternative Asset Access",
            description: "Exclusive deployment pipelines into private equity, premier venture vehicles, institutional real estate syndicates, and digital asset custody frameworks withheld from retail markets."
        }
    ];

    const investmentMetrics = [
        { value: "0.1%", label: "Top-Tier Risk Mitigation Index" },
        { value: "Bespoke", label: "Alpha Modeling Architecture" },
        { value: "Global", label: "Custodial Clearing Networks" },
        { value: "Multi-Gen", label: "Tactical Longevity Focus" }
    ];

    return (
        <section
            data-aos="fade-up"
            data-aos-delay="200"
            className="portfolio-section"
            id="portfolio"
        >
            <div className="portfolio-header">
                <span className="portfolio-subtitle">Asset Architecture & Stewardship</span>
                <h2>Sovereign Portfolio Management</h2>
                <p>
                    We construct highly resilient, cross-border investment matrices. By balancing
                    classical governance frameworks with progressive market engines, your capital
                    actively captures global opportunities while insulated from volatility.
                </p>
            </div>

            <div className="portfolio-grid">
                {strategicOfferings.map((offering, index) => (
                    <div className="portfolio-card" key={index}>
                        <div className="portfolio-icon-wrapper">
                            {offering.icon}
                        </div>
                        <h3>{offering.title}</h3>
                        <p>{offering.description}</p>
                    </div>
                ))}
            </div>

            <div className="portfolio-methodology">
                <div className="methodology-content">
                    <h3>The Dynamic Balancing Matrix</h3>
                    <p>
                        Our approach is fundamentally unaligned with cookie-cutter algorithms. We utilize a proprietary
                        tri-factor optimization framework that reconciles your immediate liquidity demands, tax-efficient
                        cross-border structural configurations, and long-term capital deployment parameters.
                    </p>
                </div>

                <div className="portfolio-metrics">
                    {investmentMetrics.map((metric, index) => (
                        <div className="metric-item" key={index}>
                            <span className="metric-value">{metric.value}</span>
                            <span className="metric-label">{metric.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};