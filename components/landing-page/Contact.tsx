"use client"

import "@/styles/landing-page/Contact.scss"
import { useState } from "react"

const CONTACT_INFO = [
    {
        id: "phone",
        label: "Private Client Line",
        value: "+1 (212) 555-0194",
        display: "+1 (212) 555-0194",
        href: "tel:+12125550194",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        id: "email",
        label: "Client Support",
        value: "support@goldenprivatewealth.com",
        display: "support@goldenprivatewealth.com",
        href: "mailto:support@goldenprivatewealth.com",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        id: "address",
        label: "Headquarters",
        value: "11 Wall Street, Suite 2400\nNew York, NY 10005",
        display: "11 Wall Street, Suite 2400\nNew York, NY 10005",
        href: "https://maps.google.com/?q=11+Wall+Street+New+York+NY+10005",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
        ),
    },
]

type FormState = "idle" | "sending" | "success" | "error"

export const ContactSection = () => {
    const [formState, setFormState] = useState<FormState>("idle")
    const [fields, setFields] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setFormState("sending")

        try {
            const res = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY,
                    from_name: fields.name,
                    ...fields,
                }),
            })
            const data = await res.json()
            setFormState(data.success ? "success" : "error")
        } catch {
            setFormState("error")
        }
    }

    return (
        <section className="contact-section" id="contact">

            {/* ── Background ornament ── */}
            <div className="contact-section__ornament" aria-hidden="true">
                <span>CONTACT</span>
            </div>

            {/* ── Header ── */}
            <div className="contact-header">
                <p className="contact-eyebrow">Private Client Services</p>
                <h2>Begin Your<br /><em>Private Consultation.</em></h2>
                <p className="contact-sub">
                    Access to Golden Private Wealth Bank is by introduction only.
                    Complete the form or reach our client desk directly — a dedicated
                    relationship manager will respond within one business day.
                </p>
            </div>

            {/* ── Two-column body ── */}
            <div className="contact-body">

                {/* ── Left — Contact info ── */}
                <div className="contact-info">

                    <div className="contact-info__items">
                        {CONTACT_INFO.map((item) => (
                            <a
                                key={item.id}
                                href={item.href}
                                className="contact-info__item"
                                target={item.id === "address" ? "_blank" : undefined}
                                rel={item.id === "address" ? "noopener noreferrer" : undefined}
                            >
                                <div className="contact-info__icon">{item.icon}</div>
                                <div className="contact-info__text">
                                    <span className="contact-info__label">{item.label}</span>
                                    <span className="contact-info__value">
                                        {item.display.split("\n").map((line, i) => (
                                            <span key={i}>{line}</span>
                                        ))}
                                    </span>
                                </div>
                                <div className="contact-info__arrow" aria-hidden="true">
                                    <svg viewBox="0 0 16 16" fill="none">
                                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* Hours */}
                    <div className="contact-hours">
                        <p className="contact-hours__label">Client Desk Hours</p>
                        <div className="contact-hours__rows">
                            <div><span>Monday – Friday</span><span>7:00 AM – 8:00 PM EST</span></div>
                            <div><span>Saturday</span><span>9:00 AM – 2:00 PM EST</span></div>
                            <div><span>Emergency Line</span><span>24 / 7</span></div>
                        </div>
                    </div>
                </div>

                {/* ── Right — Web3Forms form ── */}
                <div className="contact-form-wrap">
                    {formState === "success" ? (
                        <div className="contact-success">
                            <div className="contact-success__icon">
                                <svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M15 24l7 7 11-14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <h3>Inquiry Received</h3>
                            <p>Your message has been securely transmitted. A dedicated relationship manager will contact you within one business day.</p>
                            <button className="btn-ghost" onClick={() => { setFormState("idle"); setFields({ name: "", email: "", phone: "", subject: "", message: "" }) }}>
                                Submit Another Inquiry
                            </button>
                        </div>
                    ) : (
                        <form className="contact-form" onSubmit={handleSubmit} noValidate>
                            <div className="form-row">
                                <div className="form-field">
                                    <label htmlFor="name">Full Name</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder="Jonathan Whitmore"
                                        value={fields.name}
                                        onChange={handleChange}
                                        required
                                        autoComplete="name"
                                    />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="j.whitmore@family.com"
                                        value={fields.email}
                                        onChange={handleChange}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label htmlFor="phone">Phone Number <span>(optional)</span></label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+1 (212) 000-0000"
                                        value={fields.phone}
                                        onChange={handleChange}
                                        autoComplete="tel"
                                    />
                                </div>
                                <div className="form-field">
                                    <label htmlFor="subject">Subject of Inquiry</label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        value={fields.subject}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled>Select a service area</option>
                                        <option value="Private Banking">Private Banking</option>
                                        <option value="Portfolio Management">Portfolio Management</option>
                                        <option value="Yield Enhancement">Yield Enhancement</option>
                                        <option value="Estate & Trust Planning">Estate &amp; Trust Planning</option>
                                        <option value="General Consultation">General Consultation</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-field form-field--full">
                                <label htmlFor="message">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    placeholder="Briefly describe your wealth management objectives or the nature of your inquiry…"
                                    value={fields.message}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-footer">
                                <p className="form-disclaimer">
                                    All communications are encrypted and governed by our absolute discretion policy.
                                    Your information will never be shared with third parties.
                                </p>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={formState === "sending"}
                                >
                                    {formState === "sending" ? (
                                        <>
                                            <span className="btn-spinner" aria-hidden="true" />
                                            Transmitting…
                                        </>
                                    ) : (
                                        <>
                                            Submit Inquiry
                                            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>

                            {formState === "error" && (
                                <p className="form-error" role="alert">
                                    Transmission failed. Please try again or contact us directly by phone.
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </section>
    )
}