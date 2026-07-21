"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { isWeekend, isSameDay, addDays, startOfMonth, differenceInCalendarDays, endOfMonth, format } from "date-fns"
import { Project } from "@prisma/client"
import { requireProjectAccess, requireSession } from "@/lib/authorization"
import {
    identifierSchema,
    parseInput,
    recurringTimesheetInputSchema,
    timesheetInputSchema,
    updateTimesheetInputSchema,
} from "@/lib/server-validation"
import { logAudit } from "@/lib/audit"


export async function getAssignedProjects() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.status === "Disable") return []

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
    if (!session || session.user.status === "Disable") return []

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
    await requireSession()
    if (!Number.isInteger(year) || year < 2000 || year > 2200) throw new Error("Invalid year")
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
    const session = await requireSession()
    const input = parseInput(timesheetInputSchema, data)
    await requireProjectAccess(session.user.id, session.user.role, input.projectId)

    // 1. Lock Validation: Cannot edit/add if > 5 days past month end
    const entryDate = new Date(input.date)
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

    if (totalHours + input.hours > 7) {
        throw new Error(`Daily limit exceeded. You have already logged ${totalHours}h. Taking this would equal ${totalHours + input.hours}h (Max 7h).`)
    }

    // Create Entry
    await prisma.timesheetEntry.create({
        data: {
            userId: session.user.id,
            projectId: input.projectId,
            date: input.date,
            hours: input.hours,
            description: input.description
        }
    })

    await logAudit("CREATE_TIMESHEET", session.user.id, `Logged ${input.hours}h for project ${input.projectId}`)

    revalidatePath("/dashboard/calendar")
    return { success: true }
}

export async function logRecurringTime(data: { projectId: string, hours: number, description: string, dates: Date[] }) {
    const session = await requireSession()
    const input = parseInput(recurringTimesheetInputSchema, data)
    await requireProjectAccess(session.user.id, session.user.role, input.projectId)

    const today = new Date()

    // 1. Validate ALL dates first (Lock & 7h limit)
    // We do this inside a transaction or just pre-check? 
    // Optimization: Fetch all existing entries for the range of dates to minimize DB calls
    // But for simplicity and robustness, we can check day by day or grouped.

    // Sort dates to find range
    if (input.dates.length === 0) return { success: true }

    const uniqueDates = Array.from(
        new Map(input.dates.map((date) => [format(date, "yyyy-MM-dd"), date])).values()
    )
    // const startRange = startOfDay(sortedDates[0])
    // const endRange = endOfDay(sortedDates[sortedDates.length - 1])

    // Fetch all entries for this user in this range? 
    // Since dates might be scattered (skipping weekends), strict range might get too much data.
    // Let's iterate. For 20-30 days, 20 clean queries is safer than complex in-memory math if not huge scale.
    // Actually, simple loop with Promise.all for validation is fine for <31 items.

    const validations = await Promise.all(uniqueDates.map(async (date) => {
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
        if (total + input.hours > 7) {
            throw new Error(`Daily limit exceeded on ${format(d, 'dd/MM/yyyy')}. Existing: ${total}h, Adding: ${input.hours}h.`)
        }

        return {
            userId: session.user.id,
            projectId: input.projectId,
            date: date,
            hours: input.hours,
            description: input.description
        }
    }))

    // 2. Execute Transaction
    await prisma.$transaction(
        validations.map(entry => prisma.timesheetEntry.create({ data: entry }))
    )

    await logAudit("CREATE_RECURRING_TIMESHEET", session.user.id, `Logged ${validations.length} entries for project ${input.projectId}`)

    revalidatePath("/dashboard/calendar")
    return { success: true, count: validations.length }
}

export async function updateEntry(entryId: string, data: { hours?: number, description?: string }) {
    const session = await requireSession()
    const validEntryId = parseInput(identifierSchema, entryId)
    const input = parseInput(updateTimesheetInputSchema, data)

    const existing = await prisma.timesheetEntry.findUnique({ where: { id: validEntryId } })
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
    if (input.hours !== undefined && input.hours !== existing.hours) {
        // Fetch others for that day
        const others = await prisma.timesheetEntry.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startOfDay(existing.date),
                    lt: endOfDay(existing.date)
                },
                id: { not: validEntryId } // Exclude self
            },
            select: { hours: true }
        })
        const totalOthers = others.reduce((sum, e) => sum + e.hours, 0)

        if (totalOthers + input.hours > 7) {
            throw new Error(`Daily limit exceeded. New Total: ${totalOthers + input.hours}h (Max 7h).`)
        }
    }

    await prisma.timesheetEntry.update({
        where: { id: validEntryId },
        data: {
            hours: input.hours,
            description: input.description
        }
    })

    await logAudit("UPDATE_TIMESHEET", session.user.id, `Updated timesheet ${validEntryId}`)

    revalidatePath("/dashboard/calendar")
    return { success: true }
}

// Helper for date boundaries
function startOfDay(d: Date) { return new Date(new Date(d).setHours(0, 0, 0, 0)) }
function endOfDay(d: Date) { return new Date(new Date(d).setHours(23, 59, 59, 999)) }

export async function deleteEntry(entryId: string) {
    const session = await requireSession()
    const validEntryId = parseInput(identifierSchema, entryId)

    const entry = await prisma.timesheetEntry.findUnique({ where: { id: validEntryId } })
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

    await prisma.timesheetEntry.delete({ where: { id: validEntryId } })
    await logAudit("DELETE_TIMESHEET", session.user.id, `Deleted timesheet ${validEntryId}`)
    revalidatePath("/dashboard/calendar")
    return { success: true }
}
