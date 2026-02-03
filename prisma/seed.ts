import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'



const prisma = new PrismaClient()

async function main() {
    const password = await bcrypt.hash('password123', 10)

    const admin = await prisma.user.upsert({
        where: { userlogin: 'Torpong.T' },
        update: {},
        create: {
            userlogin: 'Torpong.T',
            email: 'Torpong.T@samtel.com',
            name: 'Torpong T',
            password,
            role: Role.ADMIN,
        },
    })

    console.log({ admin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
