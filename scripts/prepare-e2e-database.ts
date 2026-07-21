import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const databaseUrl = process.env.DATABASE_URL ?? ""
const password = process.env.E2E_ADMIN_PASSWORD

if (!databaseUrl.includes("timesheet-e2e") || process.env.E2E_ALLOW_DB_RESET !== "true") {
    throw new Error("Refusing to prepare a database that is not an explicitly approved timesheet-e2e database")
}

if (!password || password.length < 12) {
    throw new Error("E2E_ADMIN_PASSWORD with at least 12 characters is required")
}

const prisma = new PrismaClient()

async function main(approvedPassword: string) {
    const passwordHash = await bcrypt.hash(approvedPassword, 12)
    await prisma.user.updateMany({
        data: {
            password: passwordHash,
            mustChangePassword: false,
            sessionVersion: { increment: 1 },
        },
    })

    const fixedGmLogin = "GM_1_9328"
    const fixedGm = await prisma.user.findUnique({ where: { userlogin: fixedGmLogin } })
    if (!fixedGm) {
        const gm = await prisma.user.findFirst({ where: { role: "GM", status: "Enable" } })
        if (!gm) throw new Error("The E2E fixture requires an enabled GM user")
        await prisma.user.update({ where: { id: gm.id }, data: { userlogin: fixedGmLogin } })
    }

    const project = await prisma.project.upsert({
        where: { code: "PROJ-E2E-GATE" },
        update: {},
        create: {
            code: "PROJ-E2E-GATE",
            name: "Production Gate Fixture",
            startDate: new Date("2026-01-01T00:00:00.000Z"),
            endDate: new Date("2026-12-31T23:59:59.999Z"),
            budget: 1,
        },
    })

    const users = await prisma.user.findMany({ where: { status: "Enable" }, select: { id: true } })
    await prisma.timesheetEntry.deleteMany({ where: { projectId: project.id } })

    for (const user of users) {
        await prisma.projectAssignment.upsert({
            where: { userId_projectId: { userId: user.id, projectId: project.id } },
            update: {},
            create: { userId: user.id, projectId: project.id },
        })
        await prisma.timesheetEntry.createMany({
            data: [
                {
                    userId: user.id,
                    projectId: project.id,
                    date: new Date("2026-03-16T00:00:00.000Z"),
                    hours: 3.5,
                    description: "E2E production gate report fixture",
                },
                {
                    userId: user.id,
                    projectId: project.id,
                    date: new Date("2026-07-20T00:00:00.000Z"),
                    hours: 2,
                    description: "E2E current month dashboard fixture",
                },
            ],
        })
    }
}

main(password)
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(async () => prisma.$disconnect())
