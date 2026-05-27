import { HeroSection } from "@/components/landing-page/HeroSection"
import { AboutUs } from "@/components/landing-page/AboutUs"
import { ValueProposition } from "@/components/landing-page/ValueProposition"
import { PrivateBanking } from "@/components/landing-page/PrivateBanking"
import { PortfolioSection } from "@/components/landing-page/Portfolio"
import { YieldEnhancementSection } from "@/components/landing-page/YieldEnhancement"
import { ContactSection } from "@/components/landing-page/Contact"

const HomePage = () => {
    return (
        <main className="page-home">
            <HeroSection />
            <AboutUs />
            <ValueProposition />
            <PrivateBanking />
            <PortfolioSection />
            <YieldEnhancementSection />
            <ContactSection />
        </main>
    )
}

export default HomePage