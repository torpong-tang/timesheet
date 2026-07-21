import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function proxy(req) {
        const token = req.nextauth.token
        if (token?.mustChangePassword) {
            return NextResponse.redirect(new URL("/timesheet/change-password", req.url))
        }
        return NextResponse.next()
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                if (!token || token.disabled || token.invalidSession) return false
                if (req.nextUrl.pathname.startsWith("/admin")) return token.role === "ADMIN"
                return true
            },
        },
        pages: {
            signIn: "/login",
        },
    }
)

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
}
