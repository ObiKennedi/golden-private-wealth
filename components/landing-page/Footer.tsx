import "@/styles/landing-page/Footer.scss"

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="global-footer">
            <div className="footer-container">

                {/* Brand Column */}
                <div className="footer-brand-col">
                    <img src="/full-logo.png" alt="Golden Logo" className="footer-logo" />
                    <p className="brand-tagline">Architects of Generational Wealth.</p>
                </div>

                {/* Navigation Links Columns */}
                <div className="footer-links-grid">
                    <div className="footer-nav-group">
                        <h4>Institution</h4>
                        <a href="#about-us">About Us</a>
                        <a href="#private-banking">Private Banking</a>
                        <a href="#portfolio-management">Portfolio Management</a>
                    </div>

                    <div className="footer-nav-group">
                        <h4>Strategies</h4>
                        <a href="#yield-enhancement">Yield Enhancement</a>
                        <a href="/esg">Sovereign ESG</a>
                        <a href="/security">Vault Infrastructure</a>
                    </div>

                    <div className="footer-nav-group">
                        <h4>Governance</h4>
                        <a href="/regulatory">Regulatory Disclosure</a>
                        <a href="/terms">Terms of Custody</a>
                        <a href="/privacy">Privacy Protocol</a>
                    </div>
                </div>
            </div>

            {/* Legal Disclaimer & Bottom Bar */}
            <div className="footer-bottom-bar">
                <div className="footer-disclaimer">
                    <p>
                        © {currentYear} Golden Private Wealth Bank. All rights reserved. Services are strictly
                        reserved for qualified institutional entities and high-net-worth individuals subject to regulatory
                        onboarding requirements. Assets cleared under premier international custodial networks.
                    </p>
                </div>
            </div>
        </footer>
    );
};