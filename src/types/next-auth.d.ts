import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            userlogin: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: string
            status: string
            mustChangePassword: boolean
        }
    }

    interface User {
        id: string
        userlogin: string
        role: string
        status: string
        sessionVersion: number
        mustChangePassword: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        userlogin: string
        role: string
        status: string
        disabled?: boolean
        sessionVersion?: number
        mustChangePassword?: boolean
        invalidSession?: boolean
    }
}
