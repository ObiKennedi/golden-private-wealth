import { Suspense } from "react"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { FullscreenLoader } from "@/components/essentials/FullscreenLoader"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

async function Resolver(): Promise<never> {
    // Show the loader for 3.5 seconds
    await new Promise((res) => setTimeout(res, 3500))

    const cookieStore = await cookies()
    const token = cookieStore.get("golden_session")?.value
    if (!token) redirect("/login")

    try {
        await jwtVerify(token!, JWT_SECRET)
    } catch {
        redirect("/login")
    }

    redirect("/user/transfers?status=success")
}

export default function ProcessingPage() {
    return (
        <Suspense fallback={<FullscreenLoader message="Initiating secure wire transfer…" />}>
            <Resolver />
        </Suspense>
    )
}