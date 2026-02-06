"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { isWeekend, isSameDay, addDays, startOfMonth, differenceInCalendarDays, endOfMonth, format } from "date-fns"
import { Project } from "@prisma/client"


export async function getAssignedProjects() {
    const session = await getServerSession(authOptions)
    if (!session) return []

    // If Admin/GM, return all. If PM/Dev, return assigned.
    // Simplifying for prototype: PM sees all for assignment, Dev sees only assigned.
    // Refinement based on req: 
    // GM sees all. PM sees own project data? (Ambiguous, assuming PM is assigned to projects they manage)

    if (session.user.role === 'ADMIN' || session.user.role === 'GM') {
        return await prisma.project.findMany()
    }

    const assignments = await prisma.projectAssignment.findMany({
        where: { userId: session.user.id },
        include: { project: true }
    })
    return assignments.map((a: { project: Project }) => a.project)
}

export async function getTimesheetEntries(date: Date) {
    const session = await getServerSession(authOptions)
    if (!session) return []

    // Fetch entries for the logged-in user for the specific month/date context? 
    // Usually we fetch a range. For now let's fetch by exact date match (for daily view) or month range.
    // Let's support fetching all entries for a specific month is better for Calendar.

    const start = startOfMonth(date)
    const end = endOfMonth(date)

    return await prisma.timesheetEntry.findMany({
        where: {
            userId: session.user.id,
            date: {
                gte: start,
                lte: end
            }
        },
        include: { project: true }
    })
}

export async function getHolidays(year: number) {
    return await prisma.holiday.findMany({
        where: { year }
    })
}

export type TimesheetInput = {
    projectId: string
    date: Date
    hours: number
    description: string
}

export async function logTime(data: TimesheetInput) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    // 1. Lock Validation: Cannot edit/add if > 5 days past month end
    const entryDate = new Date(data.date)
    const today = new Date()
    const monthEndOfEntry = endOfMonth(entryDate)
    const lockDate = addDays(monthEndOfEntry, 5)

    if (today > lockDate) {
        throw new Error("Period is locked. Cannot log time for this month anymore.")
    }

    // 2. 7-Hour Validation
    // Fetch existing entries for that day
    const existingEntries = await prisma.timesheetEntry.findMany({
        where: {
            userId: session.user.id,
            date: {
                gte: new Date(entryDate.setHours(0, 0, 0, 0)),
                lt: new Date(entryDate.setHours(23, 59, 59, 999))
            }
        }
    })

    const totalHours = existingEntries.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0)

    if (totalHours + data.hours > 7) {
        throw new Error(`Daily limit exceeded. You have already logged ${totalHours}h. Taking this would equal ${totalHours + data.hours}h (Max 7h).`)
    }

    // Create Entry
    await prisma.timesheetEntry.create({
        data: {
            userId: session.user.id,
            projectId: data.projectId,
            date: data.date,
            hours: data.hours,
            description: data.description
        }
    })

    revalidatePath("/dashboard/calendar")
    return { success: true }
}

export async function logRecurringTime(data: { projectId: string, hours: number, description: string, dates: Date[] }) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const today = new Date()

    // 1. Validate ALL dates first (Lock & 7h limit)
    // We do this inside a transaction or just pre-check? 
    // Optimization: Fetch all existing entries for the range of dates to minimize DB calls
    // But for simplicity and robustness, we can check day by day or grouped.

    // Sort dates to find range
    if (data.dates.length === 0) return { success: true }

    const sortedDates = [...data.dates].sort((a, b) => a.getTime() - b.getTime())
    // const startRange = startOfDay(sortedDates[0])
    // const endRange = endOfDay(sortedDates[sortedDates.length - 1])

    // Fetch all entries for this user in this range? 
    // Since dates might be scattered (skipping weekends), strict range might get too much data.
    // Let's iterate. For 20-30 days, 20 clean queries is safer than complex in-memory math if not huge scale.
    // Actually, simple loop with Promise.all for validation is fine for <31 items.

    const validations = await Promise.all(data.dates.map(async (date) => {
        const d = new Date(date)

        // Lock Check
        const monthEndOfEntry = endOfMonth(d)
        const lockDate = addDays(monthEndOfEntry, 5)
        if (today > lockDate) {
            throw new Error(`Period is locked for ${format(d, 'yyyy-MM-dd')}.`)
        }

        // 7-Hour Check
        const existingEntries = await prisma.timesheetEntry.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: new Date(d.setHours(0, 0, 0, 0)),
                    lt: new Date(d.setHours(23, 59, 59, 999))
                }
            },
            select: { hours: true }
        })
        const total = existingEntries.reduce((sum, e) => sum + e.hours, 0)
        if (total + data.hours > 7) {
            throw new Error(`Daily limit exceeded on ${format(d, 'dd/MM/yyyy')}. Existing: ${total}h, Adding: ${data.hours}h.`)
        }

        return {
            userId: session.user.id,
            projectId: data.projectId,
            date: date,
            hours: data.hours,
            description: data.description
        }
    }))

    // 2. Execute Transaction
    await prisma.$transaction(
        validations.map(entry => prisma.timesheetEntry.create({ data: entry }))
    )

    revalidatePath("/dashboard/calendar")
    return { success: true, count: validations.length }
}

export async function updateEntry(entryId: string, data: { hours?: number, description?: string }) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const existing = await prisma.timesheetEntry.findUnique({ where: { id: entryId } })
    if (!existing) throw new Error("Entry not found")
    if (existing.userId !== session.user.id) throw new Error("Unauthorized")

    // Lock Validation
    const today = new Date()
    const monthEndOfEntry = endOfMonth(existing.date)
    const lockDate = addDays(monthEndOfEntry, 5)
    if (today > lockDate) {
        throw new Error("Period is locked.")
    }

    // 7-Hour Validation (only if hours changed)
    if (data.hours !== undefined && data.hours !== existing.hours) {
        // Fetch others for that day
        const others = await prisma.timesheetEntry.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startOfDay(existing.date),
                    lt: endOfDay(existing.date)
                },
                id: { not: entryId } // Exclude self
            },
            select: { hours: true }
        })
        const totalOthers = others.reduce((sum, e) => sum + e.hours, 0)

        if (totalOthers + data.hours > 7) {
            throw new Error(`Daily limit exceeded. New Total: ${totalOthers + data.hours}h (Max 7h).`)
        }
    }

    await prisma.timesheetEntry.update({
        where: { id: entryId },
        data: {
            hours: data.hours,
            description: data.description
        }
    })

    revalidatePath("/dashboard/calendar")
    return { success: true }
}

// Helper for date boundaries
function startOfDay(d: Date) { return new Date(new Date(d).setHours(0, 0, 0, 0)) }
function endOfDay(d: Date) { return new Date(new Date(d).setHours(23, 59, 59, 999)) }

export async function deleteEntry(entryId: string) {
    const session = await getServerSession(authOptions)
    if (!session) throw new Error("Unauthorized")

    const entry = await prisma.timesheetEntry.findUnique({ where: { id: entryId } })
    if (!entry) throw new Error("Entry not found")

    // Lock Validation
    const entryDate = new Date(entry.date)
    const today = new Date()
    const monthEndOfEntry = endOfMonth(entryDate)
    const lockDate = addDays(monthEndOfEntry, 5)

    if (today > lockDate) {
        throw new Error("Period is locked. Cannot delete time for this month anymore.")
    }

    if (entry.userId !== session.user.id) throw new Error("Unauthorized")

    await prisma.timesheetEntry.delete({ where: { id: entryId } })
    revalidatePath("/dashboard/calendar")
    return { success: true }
}
