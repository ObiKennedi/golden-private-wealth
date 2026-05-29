import "./layout.scss"
import { RedirectButton } from "@/components/essentials/RedirectButton"
import { ArrowBigLeft } from "lucide-react"
import { Suspense } from "react"
import { FullscreenLoader } from "@/components/essentials/FullscreenLoader"

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="auth-layout">
            <video
                src="/auth/layout-bg.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="auth-layout__video"
            />
            <RedirectButton
                path="/"
                className="auth-layout__btn"
                aria-label="Back to home"
            >
                <ArrowBigLeft size={22} />
            </RedirectButton>
            <Suspense fallback={<FullscreenLoader />}>
                <div className="auth-layout__content">
                    {children}
                </div>
            </Suspense>
        </div>
    )
}

export default AuthLayout