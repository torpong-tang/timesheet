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

                // We cannot use logAudit here directly effectively because authorize runs on server 
                // but simpler to do it in the callback or here if we import it.
                // We need to be careful about async context.

                // Let's import logAudit dynamically inside to avoid circular deps if any (unlikely here)
                const { logAudit } = await import("@/lib/audit")
                await logAudit("LOGIN_SUCCESS", user.id, `User ${user.userlogin} logged in`)

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role, // Pass role to session
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
                token.picture = user.image
            }
            if (trigger === "update" && session?.image) {
                token.picture = session.image
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role
                session.user.id = token.id as string
                session.user.image = token.picture
            }
            return session
        }
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET,
}
