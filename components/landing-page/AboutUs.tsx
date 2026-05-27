"use client"

import "@/styles/landing-page/AboutUs.scss";
import { useEffect } from "react";
import Aos from "aos";
import "aos/dist/aos.css";

export const AboutUs = () => {
    useEffect(() => {
        Aos.init({ duration: 1000 });
    }, []);
    return (
        <section className="about-us" id="about">
            <img src="/landing-page/about.jpg" alt="About Us" data-aos="fade-right" />
            <div className="about-us-content">
                <h2 data-aos="fade-up">Where Legacy Meets Modern Fortitude.</h2>
                <div>
                    <p data-aos="fade-up" data-aos-delay="100">
                        Golden Private Wealth Bank was founded on an unyielding promise: to preserve, cultivate, and shield the structural legacies of the world’s most discerning families and institutions. Born from a heritage of traditional private banking values, our institution was built from the ground up to view wealth through the lens of generations rather than quarters. We understand that true prosperity is not merely about immediate liquidity, but about establishing an enduring financial fortress that stands resilient against global market shifts. For decades, our foundational pillars of absolute discretion, fiscal conservatism, and bespoke stewardship have served as the bedrock of trust for clients who demand nothing less than perfection.
                    </p>
                    <p data-aos="fade-up" data-aos-delay="200">
                        While our principles remain anchored in time-tested traditions, our operational framework is built entirely for the modern frontier. Golden merges the sophisticated, high-touch exclusivity of classical wealth management with institutional-grade technology and contemporary security paradigms. From cryptographic asset protection and real-time global portfolio mapping to predictive algorithmic risk-modeling, we equip our clients with advanced instruments to navigate an increasingly complex economic landscape. This seamless integration ensures that while your capital remains guarded by historical fortitude, it actively capitalizes on the efficiency, speed, and fluid intelligence of today's financial ecosystems.
                    </p>
                </div>
                <div
                    className="strategy-framework-tags"
                    data-aos="fade-up"
                    data-aos-delay="300"
                >
                    <span>ESG Compliant</span>
                    <span>SRI Architecture</span>
                    <span>Impact Investing</span>
                    <span>Thematic Allocation</span>
                    <span>Ethical Governance</span>
                    <span>Best-In-Class Screening</span>
                </div>
            </div>
        </section>
    )
}