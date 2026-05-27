import { Footer } from "@/components/landing-page/Footer"
import NavBar from "@/components/landing-page/NavBar"

const RootLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <NavBar />
            {children}
            <Footer />
        </>
    )
}

export default RootLayout