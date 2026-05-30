import { Suspense } from "react"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"
import { FullscreenLoader } from "@/components/essentials/FullscreenLoader"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

async function Resolver(): Promise<never> {
    await new Promise((res) => setTimeout(res, 3000)) // your 3s beauty delay

    const cookieStore = await cookies()
    const token = cookieStore.get("golden_session")?.value

    if (!token) redirect("/login")

    try {
        const { payload } = await jwtVerify(token!, JWT_SECRET)
        const role = payload.role as string

        if (role === "ADMIN") redirect("/admin")
        else redirect("/user")

    } catch (err: any) {
        if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
        redirect("/login")
    }
}

export default function Page() {
    return (
        <Suspense fallback={<FullscreenLoader message="Verifying session..." />}>
            <Resolver />
        </Suspense>
    )
}