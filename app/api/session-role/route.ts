import { jwtVerify } from "jose"
import { NextRequest, NextResponse } from "next/server"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret")

export async function GET(req: NextRequest) {
    const token = req.cookies.get("golden_session")?.value

    if (!token) return NextResponse.json({ role: null })

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET)
        return NextResponse.json({ role: payload.role })
    } catch {
        return NextResponse.json({ role: null })
    }
}