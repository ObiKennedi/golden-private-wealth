"use client"

import "@/styles/landing-page/Hero.scss";
import { RedirectButton } from "../essentials/RedirectButton";
import { useEffect } from "react";
import aos from "aos";
import "aos/dist/aos.css";

export const HeroSection = () => {
    useEffect(() => {
        aos.init({
            duration: 1000,
            once: true
        });
    }, []);

    return (
        <section className="hero-section" id="home">
            <video
                src="/landing-page/hero-bg.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="hero-video"
            />

            <div className="hero-content" data-aos="fade-up" data-aos-delay="200">
                <img src="/full-logo.png" alt="Full Logo" />
                <p>Your Legacy, Securely Handled.</p>

                <div>
                    <RedirectButton path="/login">Get Started</RedirectButton>
                    <RedirectButton path="#about">About Us</RedirectButton>
                </div>
            </div>
        </section>
    );
};