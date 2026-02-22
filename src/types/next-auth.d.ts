import { DefaultSession, DefaultUser } from "next-auth"
// import { Role } from "@prisma/client"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            userlogin: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: string
        }
    }

    interface User {
        id: string
        userlogin: string
        role: string
    }

    interface JWT {
        id: string
        userlogin: string
        role: string
    }
}


