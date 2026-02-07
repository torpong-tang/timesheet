"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, isWeekend, isSameDay } from "date-fns"

export type DashboardStats = {
    totalHoursMonth: number
    totalHoursPrevMonth: number
    topProjects: { name: string; code: string; hours: number }[]
    recentActivity: { id: string; project: string; date: Date; hours: number; description: string }[]
    projectStatus?: { id: string; name: string; code: string; budget: number; usedBudget: number; usedHours: number }[]
    workableHoursMonth: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const { role, id: userId } = session.user
    const now = new Date()
    const startMonth = startOfMonth(now)
    const endMonth = endOfMonth(now)
    const startPrevMonth = startOfMonth(subMonths(now, 1))
    const endPrevMonth = endOfMonth(subMonths(now, 1))

    // 1. Fetch Hours Logic based on Role
    // REFACTOR: All main dashboard stats should be PERSONAL for the user, regardless of Role.
    // Managers use the TeamView component for Team data.
    const whereClause: any = {
        userId: userId,
        date: { gte: startMonth, lte: endMonth }
    }
    const prevWhereClause: any = {
        userId: userId,
        date: { gte: startPrevMonth, lte: endPrevMonth }
    }

    // A. Total Hours (Current Month)
    const entries = await prisma.timesheetEntry.findMany({
        where: whereClause,
        select: { hours: true, projectId: true }
    })
    const totalHoursMonth = entries.reduce((sum, e) => sum + e.hours, 0)

    // B. Total Hours (Previous Month)
    const prevEntries = await prisma.timesheetEntry.findMany({
        where: prevWhereClause,
        select: { hours: true }
    })
    const totalHoursPrevMonth = prevEntries.reduce((sum, e) => sum + e.hours, 0)

    // B2. Workable Hours (Current Month)
    // (Days in Month - Weekends - Holidays) * 7
    const holidays = await prisma.holiday.findMany({
        where: {
            date: { gte: startMonth, lte: endMonth }
        }
    })

    const allDays = eachDayOfInterval({ start: startMonth, end: endMonth })
    const workingDays = allDays.filter(day => {
        const isWknd = isWeekend(day)
        const isHoli = holidays.some(h => isSameDay(h.date, day))
        return !isWknd && !isHoli
    })
    const workableHoursMonth = workingDays.length * 7

    // C. Top Projects (by hours this month)
    const projectHours: Record<string, number> = {}
    entries.forEach(e => {
        projectHours[e.projectId] = (projectHours[e.projectId] || 0) + e.hours
    })

    // Fetch project details for top 5
    const topProjectIds = Object.keys(projectHours).sort((a, b) => projectHours[b] - projectHours[a]).slice(0, 5)
    const topProjectsData = await prisma.project.findMany({
        where: { id: { in: topProjectIds } },
        select: { id: true, name: true, code: true }
    })

    const topProjects = topProjectsData.map(p => ({
        name: p.name,
        code: p.code,
        hours: projectHours[p.id] || 0
    })).sort((a, b) => b.hours - a.hours)


    // D. Recent Activity (Personal Only for consistency with Hours)
    // Team Activity is handled by TeamView component
    const recentActivityRaw = await prisma.timesheetEntry.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { project: { select: { code: true } } }
    })

    const recentActivity = recentActivityRaw.map(e => ({
        id: e.id,
        project: e.project.code,
        date: e.date,
        hours: e.hours,
        description: e.description
    }))


    // E. Project Status (For PM/GM) - Budget vs Actual
    let projectStatus = undefined
    if (role === 'PM' || role === 'GM' || role === 'ADMIN') {
        let projectScopeWhere: any = {}
        if (role === 'PM') {
            const assignments = await prisma.projectAssignment.findMany({ where: { userId }, select: { projectId: true } })
            projectScopeWhere.id = { in: assignments.map(a => a.projectId) }
        }

        const statsProjects = await prisma.project.findMany({
            where: projectScopeWhere,
            include: {
                timesheets: { select: { hours: true } } // Fetching all timesheets to calc total used
            },
            take: 10 // Limit for dashboard
        })

        projectStatus = statsProjects.map(p => {
            const usedHours = p.timesheets.reduce((acc, t) => acc + t.hours, 0)
            // Assumption: rate isn't in DB, using abstract calculation or just hours
            // Let's assume budget is in CURRENCY and we don't have hourly rate yet. 
            // Requirement 3 in initial prompt said "budget". 
            // Let's just return Budget vs Used Hours for now as metrics.
            return {
                id: p.id,
                name: p.name,
                code: p.code,
                budget: p.budget,
                usedBudget: usedHours * 500, // Dummy Rate 500/hr
                usedHours
            }
        })
    }

    return {
        totalHoursMonth,
        totalHoursPrevMonth,
        topProjects,
        recentActivity,
        projectStatus,
        workableHoursMonth
    }
}

export type TeamUserStat = {
    userId: string
    name: string
    image: string | null
    totalHours: number
    workableHours: number
    isComplete: boolean
    percentage: number
}

export type TeamEntry = {
    id: string
    date: Date
    hours: number
    description: string
    project: { code: string; name: string }
    user: { name: string; image: string | null }
}

export async function getTeamData(
    monthDate: Date,
    filterUserId?: string,
    filterProjectId?: string
) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const { role, id: currentUserId } = session.user
    if (role === 'DEV') return { users: [], entries: [] }

    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)

    // 1. Determine Scope
    let allowedProjectIds: string[] | undefined = undefined
    let allowedUserIds: string[] | undefined = undefined

    if (role === 'PM') {
        const assignments = await prisma.projectAssignment.findMany({
            where: { userId: currentUserId },
            select: { projectId: true }
        })
        allowedProjectIds = assignments.map(a => a.projectId)

        const usersInProjects = await prisma.projectAssignment.findMany({
            where: { projectId: { in: allowedProjectIds } },
            select: { userId: true }
        })
        allowedUserIds = Array.from(new Set(usersInProjects.map(u => u.userId)))
    }

    // 2. Fetch Entries (For Table)
    const entryWhere: any = {
        date: { gte: start, lte: end }
    }

    if (allowedProjectIds) {
        entryWhere.projectId = { in: allowedProjectIds }
    }

    if (filterUserId) {
        // Validation: if PM, check if user is in allowedUserIds
        if (allowedUserIds && !allowedUserIds.includes(filterUserId)) {
            // force empty
            entryWhere.userId = "none"
        } else {
            entryWhere.userId = filterUserId
        }
    }

    if (filterProjectId) {
        if (allowedProjectIds && !allowedProjectIds.includes(filterProjectId)) {
            entryWhere.projectId = "none"
        } else {
            entryWhere.projectId = filterProjectId
        }
    }

    const entriesData = await prisma.timesheetEntry.findMany({
        where: entryWhere,
        include: {
            project: { select: { code: true, name: true } },
            user: { select: { name: true, image: true } }
        },
        orderBy: { date: 'desc' },
        take: 50 // Limit stats
    })

    const entries: TeamEntry[] = entriesData.map(e => ({
        id: e.id,
        date: e.date,
        hours: e.hours,
        description: e.description,
        project: e.project,
        user: {
            name: e.user.name || "Unknown",
            image: e.user.image
        }
    }))


    // 3. Fetch User Stats (For Chart) -> Global Hours
    const holidays = await prisma.holiday.findMany({ where: { date: { gte: start, lte: end } } })
    const allDays = eachDayOfInterval({ start, end })
    const workingDays = allDays.filter(day => !isWeekend(day) && !holidays.some(h => isSameDay(h.date, day))).length
    const workableHours = workingDays * 7

    const userWhere: any = {}
    if (allowedUserIds) {
        userWhere.id = { in: allowedUserIds }
    }
    // Apply Filter to Chart Users too
    if (filterUserId) {
        userWhere.id = filterUserId
    }
    if (filterProjectId) {
        const projectAssigns = await prisma.projectAssignment.findMany({
            where: { projectId: filterProjectId },
            select: { userId: true }
        })
        const ids = projectAssigns.map(a => a.userId)
        if (allowedUserIds) {
            // Intersection
            userWhere.id = { in: allowedUserIds.filter(id => ids.includes(id)) }
        } else {
            userWhere.id = { in: ids }
        }
    }

    const users = await prisma.user.findMany({
        where: userWhere,
        select: { id: true, name: true, image: true }
    })

    // Fetch Aggregated Hours per User (Global)
    const statsData = await prisma.timesheetEntry.groupBy({
        by: ['userId'],
        where: {
            date: { gte: start, lte: end },
            userId: { in: users.map(u => u.id) }
        },
        _sum: { hours: true }
    })

    const userStats: TeamUserStat[] = users.map(u => {
        const found = statsData.find(s => s.userId === u.id)
        const total = found?._sum.hours || 0
        return {
            userId: u.id,
            name: u.name || "Unknown",
            image: u.image,
            totalHours: total,
            workableHours,
            isComplete: total >= workableHours,
            percentage: Math.min((total / workableHours) * 100, 100)
        }
    })

    return {
        users: userStats.sort((a, b) => b.percentage - a.percentage),
        entries
    }
}

export async function getFilters() {
    const session = await getServerSession(authOptions)
    if (!session) return { users: [], projects: [] }
    const { role, id } = session.user

    if (role === 'DEV') return { users: [], projects: [] }

    let projectWhere: any = {}
    let userWhere: any = {}

    if (role === 'PM') {
        const assignments = await prisma.projectAssignment.findMany({
            where: { userId: id },
            select: { projectId: true }
        })
        const pIds = assignments.map(a => a.projectId)
        projectWhere.id = { in: pIds }

        // Find users in those projects
        const uAssigns = await prisma.projectAssignment.findMany({
            where: { projectId: { in: pIds } },
            select: { userId: true }
        })
        userWhere.id = { in: uAssigns.map(a => a.userId) }
    }

    const projects = await prisma.project.findMany({
        where: projectWhere,
        select: { id: true, name: true, code: true },
        orderBy: { code: 'asc' }
    })

    const users = await prisma.user.findMany({
        where: userWhere,
        select: { id: true, name: true, userlogin: true },
        orderBy: { name: 'asc' }
    })

    return {
        users: users.map(u => ({ id: u.id, name: u.name || u.userlogin })),
        projects: projects.map(p => ({ id: p.id, name: p.name, code: p.code }))
    }
}
