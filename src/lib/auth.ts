import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import {
    clearLoginFailures,
    getLoginKey,
    isLoginBlocked,
    recordLoginFailure,
} from "@/lib/login-rate-limit"

const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-login-password", 12)

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Non-Email Login",
            credentials: {
                userlogin: { label: "User Login", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, request) {
                if (!credentials?.userlogin || !credentials?.password) {
                    return null
                }

                const forwardedFor = request.headers?.["x-forwarded-for"] ?? request.headers?.["x-real-ip"]
                const loginKey = getLoginKey(credentials.userlogin, forwardedFor)
                if (isLoginBlocked(loginKey)) return null

                const user = await prisma.user.findUnique({
                    where: { userlogin: credentials.userlogin }
                })

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user?.password ?? DUMMY_PASSWORD_HASH
                )

                if (!user || !isPasswordValid || user.status !== "Enable") {
                    recordLoginFailure(loginKey)
                    if (user) {
                        const { logAudit } = await import("@/lib/audit")
                        await logAudit("LOGIN_FAILED", user.id, `Failed login for ${user.userlogin}`)
                    }
                    return null
                }

                clearLoginFailures(loginKey)

                const { logAudit } = await import("@/lib/audit")
                await logAudit(
                    "LOGIN_SUCCESS",
                    user.id,
                    `User ${user.userlogin} logged in`
                )

                return {
                    id: user.id,
                    userlogin: user.userlogin,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                    status: user.status,
                    sessionVersion: user.sessionVersion,
                    mustChangePassword: user.mustChangePassword,
                }
            }
        })
    ],

    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60,
    },

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.userlogin = user.userlogin
                token.picture = user.image
                token.status = user.status
                token.disabled = user.status !== "Enable"
                token.sessionVersion = user.sessionVersion
                token.mustChangePassword = user.mustChangePassword
                token.invalidSession = false
            } else if (token.id) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: {
                        role: true,
                        status: true,
                        userlogin: true,
                        image: true,
                        sessionVersion: true,
                        mustChangePassword: true,
                    },
                })
                token.invalidSession = !currentUser || token.sessionVersion !== currentUser.sessionVersion
                token.disabled = token.invalidSession || !currentUser || currentUser.status !== "Enable"
                if (currentUser) {
                    token.role = currentUser.role
                    token.status = currentUser.status
                    token.userlogin = currentUser.userlogin
                    token.picture = currentUser.image
                    token.mustChangePassword = currentUser.mustChangePassword
                }
            }
            if (trigger === "update" && session?.image) {
                token.picture = session.image
            }
            return token
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string
                session.user.id = token.id as string
                session.user.userlogin = token.userlogin as string
                session.user.image = token.picture as string
                session.user.status = token.status as string
                session.user.mustChangePassword = Boolean(token.mustChangePassword)
                if (token.invalidSession) session.user.status = "Disable"
            }
            return session
        },

        // 🔥 เพิ่มส่วนนี้เข้าไป
        async redirect({ url, baseUrl }) {
            // ถ้ากลับ root → พาไป basePath
            if (url === baseUrl || url === `${baseUrl}/`) {
                return `${baseUrl}/timesheet`
            }

            // ถ้าเป็น path ภายใน เช่น /dashboard
            if (url.startsWith("/")) {
                return `${baseUrl}${url}`
            }

            // ถ้าเป็นโดเมนเดียวกัน
            if (new URL(url).origin === baseUrl) {
                return url
            }

            return `${baseUrl}/timesheet`
        }
    },

    pages: {
        signIn: "/login",
    },

    secret: process.env.NEXTAUTH_SECRET,
}
