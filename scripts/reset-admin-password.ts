import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const userlogin = "Torpong.T"
    const newPassword = "password123"

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    try {
        const user = await prisma.user.update({
            where: { userlogin },
            data: { password: hashedPassword }
        })
        console.log(`Password reset successfully for user: ${user.name} (${user.userlogin})`)
    } catch (e) {
        console.error("Error resetting password:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
