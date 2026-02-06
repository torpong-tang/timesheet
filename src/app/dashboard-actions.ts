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
    let whereClause: any = {
        date: { gte: startMonth, lte: endMonth }
    }
    let prevWhereClause: any = {
        date: { gte: startPrevMonth, lte: endPrevMonth }
    }

    if (role === 'DEV') {
        whereClause.userId = userId
        prevWhereClause.userId = userId
    } else if (role === 'PM') {
        const assignments = await prisma.projectAssignment.findMany({
            where: { userId },
            select: { projectId: true }
        })
        const projectIds = assignments.map(a => a.projectId)
        whereClause.projectId = { in: projectIds }
        prevWhereClause.projectId = { in: projectIds }
    }
    // GM/ADMIN sees all (no extra filter)

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


    // D. Recent Activity (Last 5 logs relevant to user)
    // Re-use logic for visibility but fetch recent dates
    let activityWhere: any = {}
    if (role === 'DEV') {
        activityWhere.userId = userId
    } else if (role === 'PM') {
        const assignments = await prisma.projectAssignment.findMany({ where: { userId }, select: { projectId: true } })
        activityWhere.projectId = { in: assignments.map(a => a.projectId) }
    }
    // GM sees all

    const recentActivityRaw = await prisma.timesheetEntry.findMany({
        where: activityWhere,
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
