import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const Role = {
    ADMIN: 'ADMIN',
    GM: 'GM',
    PM: 'PM',
    DEV: 'DEV',
}

async function main() {
    console.log('Start seeding...')
    const password = await bcrypt.hash('password123', 10)

    // 1. Existing Admin
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
    console.log('Seeded Admin: Torpong.T')

    // 2. Generate Users (GM: 1, PM: 5, DEV: 10)
    const seedUsers = async (role: string, count: number) => {
        const userIds = []
        for (let i = 1; i <= count; i++) {
            // Use time to ensure uniqueness across runs
            const randomSuffix = Math.floor(Math.random() * 10000)
            const userlogin = `${role}_${i}_${randomSuffix}`
            const user = await prisma.user.create({
                data: {
                    userlogin,
                    email: `${userlogin}@test.com`,
                    name: `${role} User ${i}`,
                    password,
                    role,
                }
            })
            userIds.push(user.id)
            console.log(`Created ${role}: ${userlogin}`)
        }
        return userIds
    }

    const gmIds = await seedUsers(Role.GM, 1)
    const pmIds = await seedUsers(Role.PM, 5)
    const devIds = await seedUsers(Role.DEV, 10)

    // 3. Generate 8 Projects
    const projectIds = []
    for (let i = 1; i <= 8; i++) {
        const code = `PROJ-${Date.now()}-${i}` // Unique code
        const project = await prisma.project.create({
            data: {
                code,
                name: `Project ${i} - ${Math.floor(Math.random() * 1000)}`,
                startDate: new Date(),
                endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                budget: 1000000 + (Math.random() * 1000000),
            }
        })
        projectIds.push(project.id)
        console.log(`Created Project: ${code}`)
    }

    // 4. Assignments
    // "Assign PM to each project" & "Assign Developer to project"
    // Strategy: Round-robin assign random PMs and Devs to projects to ensure coverage.

    // Assign at least 1 PM to every project
    for (let i = 0; i < projectIds.length; i++) {
        const projectId = projectIds[i]
        const pmId = pmIds[i % pmIds.length] // Cycle through PMs

        await prisma.projectAssignment.create({
            data: { userId: pmId, projectId }
        })
    }

    // Assign at least 2 Devs to every project
    for (let i = 0; i < projectIds.length; i++) {
        const projectId = projectIds[i]
        // Pick 2 random devs
        const shuffledDevs = [...devIds].sort(() => 0.5 - Math.random())
        const selectedDevs = shuffledDevs.slice(0, 2)

        for (const devId of selectedDevs) {
            // Check if already assigned (though strictly new projects shouldn't have collisions yet)
            await prisma.projectAssignment.create({ // using create since data is fresh
                data: { userId: devId, projectId }
            })
        }
    }

    // Also ensure every PM and Dev is assigned to AT LEAST one project (Handling the inverse interpretation)
    const allStaff = [...pmIds, ...devIds]
    for (const userId of allStaff) {
        // Check if user has assignments (simple approximation: just add them to a random project if not)
        const count = await prisma.projectAssignment.count({ where: { userId } })
        if (count === 0) {
            const randomProject = projectIds[Math.floor(Math.random() * projectIds.length)]
            await prisma.projectAssignment.create({
                data: { userId, projectId: randomProject }
            }).catch(() => { }) // Catch duplicates just in case
        }
    }

    // 5. Generate Timesheet Entries for March 2026
    console.log('Generating Timesheets for March 2026...')
    const startDate = new Date('2026-03-01T00:00:00.000Z')
    const endDate = new Date('2026-03-31T23:59:59.999Z') // Inclusive

    // Fetch all users we just created (plus admin) to be sure
    // Ideally we use the IDs we already have in `allStaff` + `admin.id`
    const usersToSeed = [admin.id, ...allStaff]

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Skip weekends (0 = Sunday, 6 = Saturday)
        const dayOfWeek = d.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) continue

        const currentDate = new Date(d) // Copy date

        for (const userId of usersToSeed) {
            // 10% chance to skip logging a day (sick leave/busy/forgot)
            if (Math.random() < 0.1) continue;

            // Find assigned projects
            const assignments = await prisma.projectAssignment.findMany({
                where: { userId },
                select: { projectId: true }
            })

            if (assignments.length === 0) continue

            // Pick one random project for the day (simplification: 1 log per day)
            const randomAssignment = assignments[Math.floor(Math.random() * assignments.length)]

            // Random hours: 2.0 to 7.0, step 0.5
            // Max 7 hours per day (Business Logic)
            const steps = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7]
            const hours = steps[Math.floor(Math.random() * steps.length)]

            // Description
            const descriptions = ['Development', 'Meeting', 'Planning', 'Code Review', 'Testing', 'Documentation']
            const description = descriptions[Math.floor(Math.random() * descriptions.length)]

            await prisma.timesheetEntry.create({
                data: {
                    userId,
                    projectId: randomAssignment.projectId,
                    date: currentDate,
                    hours,
                    description
                }
            })
        }
    }

    console.log('Seeding completed.')
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
