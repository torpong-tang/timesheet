import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Non-Email Login",
            credentials: {
                userlogin: { label: "User Login", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.userlogin || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { userlogin: credentials.userlogin }
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

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
                }
            }
        })
    ],

    session: {
        strategy: "jwt",
    },

    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role
                token.id = user.id
                token.userlogin = user.userlogin
                token.picture = user.image
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
