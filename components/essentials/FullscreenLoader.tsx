"use client"

import "@/styles/essentials/FullscreenLoader.scss"

interface FullscreenLoaderProps {
    message?: string
}

export const FullscreenLoader = ({ message = "Authenticating your credentials..." }: FullscreenLoaderProps) => {
    return (
        <div className="loader-overlay" role="status" aria-live="polite" aria-label="Loading">

            {/* Animated background grid */}
            <div className="loader-grid" aria-hidden="true" />

            {/* Radial gold bloom */}
            <div className="loader-bloom" aria-hidden="true" />

            {/* Core content */}
            <div className="loader-content">

                {/* Shield vault emblem */}
                <div className="loader-emblem" aria-hidden="true">
                    <svg viewBox="0 0 80 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M40 4L74 17V40C74 60.4 59.1 78.5 40 84 20.9 78.5 6 60.4 6 40V17L40 4Z"
                            stroke="url(#shield-gold)"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            className="loader-shield-path"
                        />
                        {/* Vault dial */}
                        <circle cx="40" cy="44" r="14" stroke="url(#shield-gold)" strokeWidth="1" className="loader-vault-ring" />
                        <circle cx="40" cy="44" r="8" stroke="url(#shield-gold)" strokeWidth="1" opacity="0.6" />
                        {/* Keyhole */}
                        <circle cx="40" cy="41" r="3" stroke="url(#shield-gold)" strokeWidth="1" />
                        <path d="M38.5 44l-1 5h5l-1-5" stroke="url(#shield-gold)" strokeWidth="1" strokeLinejoin="round" />
                        {/* Handle bars */}
                        <path d="M22 44h6M52 44h6" stroke="url(#shield-gold)" strokeWidth="1" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="shield-gold" x1="6" y1="4" x2="74" y2="84" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#8a5e0a" />
                                <stop offset="0.40" stopColor="#c9952a" />
                                <stop offset="0.65" stopColor="#f0d068" />
                                <stop offset="0.85" stopColor="#c9952a" />
                                <stop offset="1" stopColor="#8a5e0a" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Rotating outer ring */}
                    <div className="loader-ring" aria-hidden="true">
                        <svg viewBox="0 0 100 100" fill="none">
                            <circle
                                cx="50" cy="50" r="46"
                                stroke="url(#ring-gold)"
                                strokeWidth="0.75"
                                strokeDasharray="4 6"
                                strokeLinecap="round"
                            />
                            <defs>
                                <linearGradient id="ring-gold" x1="4" y1="50" x2="96" y2="50" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#8a5e0a" stopOpacity="0" />
                                    <stop offset="0.5" stopColor="#f0d068" stopOpacity="0.8" />
                                    <stop offset="1" stopColor="#8a5e0a" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Pulse ring */}
                    <div className="loader-pulse" aria-hidden="true" />
                </div>

                {/* Wordmark */}
                <div className="loader-wordmark">
                    <span className="loader-wordmark__main">GOLDEN</span>
                    <span className="loader-wordmark__sub">Private Wealth Bank</span>
                </div>

                {/* Progress bar */}
                <div className="loader-progress" aria-hidden="true">
                    <div className="loader-progress__track">
                        <div className="loader-progress__fill" />
                    </div>
                </div>

                {/* Status message */}
                <p className="loader-message">{message}</p>

            </div>

            {/* Corner brackets */}
            <div className="loader-corner loader-corner--tl" aria-hidden="true" />
            <div className="loader-corner loader-corner--tr" aria-hidden="true" />
            <div className="loader-corner loader-corner--bl" aria-hidden="true" />
            <div className="loader-corner loader-corner--br" aria-hidden="true" />
        </div>
    )
}