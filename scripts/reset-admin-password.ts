import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { passwordSchema } from "../src/lib/server-validation"

const prisma = new PrismaClient()

async function main() {
    const userlogin = process.env.ADMIN_RESET_LOGIN
    const newPassword = process.env.ADMIN_RESET_PASSWORD

    if (!userlogin || !newPassword) {
        throw new Error("ADMIN_RESET_LOGIN and ADMIN_RESET_PASSWORD are required")
    }

    const validatedPassword = passwordSchema.parse(newPassword)

    const hashedPassword = await bcrypt.hash(validatedPassword, 12)

    try {
        const user = await prisma.user.update({
            where: { userlogin },
            data: {
                password: hashedPassword,
                mustChangePassword: true,
                sessionVersion: { increment: 1 },
            }
        })
        console.log(`Password reset successfully for user: ${user.name} (${user.userlogin})`)
    } catch (error) {
        console.error("Error resetting password:", error)
        process.exitCode = 1
    } finally {
        await prisma.$disconnect()
    }
}

main()
