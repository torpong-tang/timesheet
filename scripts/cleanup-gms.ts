
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const gms = await prisma.user.findMany({
        where: { role: 'GM' },
        orderBy: { createdAt: 'asc' }
    })

    console.log(`Found ${gms.length} GM users.`)

    if (gms.length <= 1) {
        console.log("No action needed.")
        return
    }

    // Keep the first one, delete the rest
    const [keep, ...remove] = gms
    console.log(`Keeping GM: ${keep.userlogin} (${keep.name})`)

    const removeIds = remove.map(u => u.id)

    // Need to delete related data first if strict relations exist?
    // User has relations: assignments, timesheets, auditLogs.
    // Cascade delete might not be enabled in schema.

    // Delete assignments
    await prisma.projectAssignment.deleteMany({
        where: { userId: { in: removeIds } }
    })

    // Delete timesheets
    await prisma.timesheetEntry.deleteMany({
        where: { userId: { in: removeIds } }
    })

    // Delete audit logs
    await prisma.auditLog.deleteMany({
        where: { userId: { in: removeIds } }
    })

    // Delete Users
    const result = await prisma.user.deleteMany({
        where: { id: { in: removeIds } }
    })

    console.log(`Deleted ${result.count} extra GM users.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
