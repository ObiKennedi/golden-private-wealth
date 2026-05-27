"use client"

import {
    Percent,
    TrendingUp,
    ShieldAlert,
    Zap,
    Globe,
    Coins
} from 'lucide-react';
import "@/styles/landing-page/YieldEnhancement.scss"

export const YieldEnhancementSection = () => {
    const strategicLevers = [
        {
            icon: <Percent size={24} />,
            title: "Structured Note Customization",
            description: "Deploy principal-protected growth vectors and barrier-reverse convertibles. We tailor equity-linked yields designed to capture fixed income returns while creating robust buffers against downside market volatility."
        },
        {
            icon: <Coins size={24} />,
            title: "Securities Lending Programs",
            description: "Extract passive cash flow out of long-term, dormant equity holds. By lending high-demand equities to institutional counterparties through fully collateralized clearing pipelines, your underlying positions generate continuous optimization."
        },
        {
            icon: <Zap size={24} />,
            title: "Discretionary Covered Call Overlays",
            description: "Systematically monetize existing core concentrations. Our options desks execute algorithmic, out-of-the-money call overwrite programs to extract premium income without risking unexpected structural liquidations."
        },
        {
            icon: <Globe size={24} />,
            title: "Cross-Border Arbitrage & Liquidity Pools",
            description: "Capitalize on localized rate imbalances across global sovereign boundaries. Access private yield-bearing institutional money markets, overnight repos, and liquidity bridges strictly vetted for capital security."
        }
    ];

    const protocolRules = [
        "All strategies require strict counterparty risk-underwriting via top-tier global custodian clearing houses.",
        "Yield targets are calibrated dynamically around pre-defined risk mandates and liquidity lock-up constraints.",
        "Collateral positions are dynamically rebalanced daily with automated real-time mark-to-market valuations."
    ];

    return (
        <section
            className="yield-enhancement-section"
            id="yield-enhancement"
        >
            <div className="yield-header">
                <span className="yield-subtitle">Capital Optimization Engines</span>
                <h2>Institutional Yield Enhancement</h2>
                <p>
                    Do not let idle capital decay. We systematically engineer secondary cash flow layers across
                    your existing portfolio infrastructure using non-directional derivatives, strategic lending vectors,
                    and premium-capture overlay systems.
                </p>
            </div>

            <div className="yield-levers-grid">
                {strategicLevers.map((lever, index) => (
                    <div
                        data-aos="fade-up"
                        key={index}
                        className="yield-lever-card"
                    >
                        <div className="lever-icon-container">
                            {lever.icon}
                        </div>
                        <h3>{lever.title}</h3>
                        <p>{lever.description}</p>
                    </div>
                ))}
            </div>

            {/* Risk Control & Protocol Metrics Banner */}
            <div className="yield-risk-governance">
                <div className="governance-headline">
                    <ShieldAlert size={32} />
                    <h3>The Capital Security Protocol</h3>
                    <p>
                        Yield maximization is irrelevant without absolute principal preservation frameworks. Our enhancement
                        desks operate under zero-compromise stress boundaries to ensure liquidity remains uncompromised.
                    </p>
                </div>

                {/* Protocol Operational Parameters List */}
                <ul className="protocol-assertions">
                    {protocolRules.map((rule, index) => (
                        <li key={index}>
                            <span className="protocol-index">0{index + 1}</span>
                            <p>{rule}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
};