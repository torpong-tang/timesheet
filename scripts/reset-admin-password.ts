import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const userlogin = process.env.ADMIN_RESET_LOGIN
    const newPassword = process.env.ADMIN_RESET_PASSWORD

    if (!userlogin || !newPassword) {
        throw new Error("ADMIN_RESET_LOGIN and ADMIN_RESET_PASSWORD are required")
    }

    if (newPassword.length < 16) {
        throw new Error("ADMIN_RESET_PASSWORD must be at least 16 characters")
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    try {
        const user = await prisma.user.update({
            where: { userlogin },
            data: { password: hashedPassword }
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
