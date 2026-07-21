"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { logAudit } from "@/lib/audit"
import { requireSession } from "@/lib/authorization"
import {
    assignmentInputSchema,
    holidayInputSchema,
    identifierSchema,
    parseInput,
    projectInputSchema,
    userInputSchema,
} from "@/lib/server-validation"

const safeUserSelect = {
    id: true,
    userlogin: true,
    email: true,
    name: true,
    role: true,
    image: true,
    status: true,
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.UserSelect

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>
export type SafeProjectAssignment = Prisma.ProjectAssignmentGetPayload<{
    include: {
        user: { select: typeof safeUserSelect },
        project: true,
    },
}>

// --- User Management ---

export async function getUsers() {
    await requireSession(["ADMIN"])
    return await prisma.user.findMany({
        select: safeUserSelect,
        orderBy: { name: 'asc' }
    })
}

export async function upsertUser(data: { id?: string, userlogin: string, name: string, email: string, role: string, password?: string, status: string }) {
    const session = await requireSession(["ADMIN"])
    const input = parseInput(userInputSchema, data)

    if (input.id) {
        // Update
        const updateData: any = {
            userlogin: input.userlogin,
            name: input.name,
            email: input.email,
            role: input.role,
            status: input.status
        }
        if (input.password) {
            updateData.password = await bcrypt.hash(input.password, 12)
            updateData.mustChangePassword = true
            updateData.sessionVersion = { increment: 1 }
        }
        await prisma.user.update({
            where: { id: input.id },
            data: updateData
        })
        await logAudit("UPDATE_USER", session.user.id, `Updated user ${input.userlogin} (${input.id}) status:${input.status}`)
    } else {
        // Create
        if (!input.password) throw new Error("Password is required for new users")
        const hashedPassword = await bcrypt.hash(input.password, 12)
        await prisma.user.create({
            data: {
                userlogin: input.userlogin,
                name: input.name,
                email: input.email,
                role: input.role,
                status: input.status,
                password: hashedPassword,
                mustChangePassword: true,
            }
        })
        await logAudit("CREATE_USER", session.user.id, `Created user ${input.userlogin}`)
    }
    revalidatePath("/admin/users")
    return { success: true }
}

export async function deleteUser(id: string) {
    const session = await requireSession(["ADMIN"])
    const validId = parseInput(identifierSchema, id)
    if (validId === session.user.id) throw new Error("You cannot delete your own account")

    await prisma.user.delete({ where: { id: validId } })
    await logAudit("DELETE_USER", session.user.id, `Deleted user ${validId}`)
    revalidatePath("/admin/users")
    return { success: true }
}

// --- Project Management ---

export async function getProjects() {
    await requireSession(["ADMIN"])
    // All roles can see projects for dropdowns, but UI might filter
    return await prisma.project.findMany({
        orderBy: { code: 'asc' }
    })
}

export async function upsertProject(data: { id?: string, code: string, name: string, startDate: Date, endDate: Date, budget?: number }) {
    const session = await requireSession(["ADMIN"])
    const input = parseInput(projectInputSchema, data)

    const payload = {
        code: input.code,
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        budget: input.budget ?? 0
    }

    if (input.id) {
        await prisma.project.update({
            where: { id: input.id },
            data: payload
        })
        await logAudit("UPDATE_PROJECT", session.user.id, `Updated project ${input.code}`)
    } else {
        await prisma.project.create({
            data: payload
        })
        await logAudit("CREATE_PROJECT", session.user.id, `Created project ${input.code}`)
    }
    revalidatePath("/admin/projects")
    return { success: true }
}

export async function deleteProject(id: string) {
    const session = await requireSession(["ADMIN"])
    const validId = parseInput(identifierSchema, id)

    await prisma.project.delete({ where: { id: validId } })
    await logAudit("DELETE_PROJECT", session.user.id, `Deleted project ${validId}`)
    revalidatePath("/admin/projects")
    return { success: true }
}

// --- Holiday Management ---

export async function getHolidays() {
    await requireSession(["ADMIN"])
    return await prisma.holiday.findMany({
        orderBy: { date: 'asc' }
    })
}

export async function upsertHoliday(data: { id?: string, name: string, date: Date, year: number }) {
    const session = await requireSession(["ADMIN"])
    const input = parseInput(holidayInputSchema, data)

    const payload = {
        name: input.name,
        date: input.date,
        year: input.year
    }

    if (input.id) {
        await prisma.holiday.update({ where: { id: input.id }, data: payload })
        await logAudit("UPDATE_HOLIDAY", session.user.id, `Updated holiday ${input.name}`)
    } else {
        await prisma.holiday.create({ data: payload })
        await logAudit("CREATE_HOLIDAY", session.user.id, `Created holiday ${input.name}`)
    }
    revalidatePath("/admin/holidays")
    return { success: true }
}

export async function deleteHoliday(id: string) {
    const session = await requireSession(["ADMIN"])
    const validId = parseInput(identifierSchema, id)

    await prisma.holiday.delete({ where: { id: validId } })
    await logAudit("DELETE_HOLIDAY", session.user.id, `Deleted holiday ${validId}`)
    revalidatePath("/admin/holidays")
    return { success: true }
}

// --- Project Assignments ---

export async function getProjectAssignments() {
    await requireSession(["ADMIN"])
    return await prisma.projectAssignment.findMany({
        include: {
            user: { select: safeUserSelect },
            project: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function assignUserToProject(userId: string, projectId: string) {
    const session = await requireSession(["ADMIN"])
    const input = parseInput(assignmentInputSchema, { userId, projectId })

    await prisma.projectAssignment.create({
        data: input
    })
    await logAudit("ASSIGN_USER", session.user.id, `Assigned user ${input.userId} to project ${input.projectId}`)
    revalidatePath("/admin/assignments")
    return { success: true }
}

export async function removeUserFromProject(assignmentId: string) {
    const session = await requireSession(["ADMIN"])
    const validId = parseInput(identifierSchema, assignmentId)

    await prisma.projectAssignment.delete({ where: { id: validId } })
    await logAudit("UNASSIGN_USER", session.user.id, `Removed assignment ${validId}`)
    revalidatePath("/admin/assignments")
    return { success: true }
}

// --- Audit Logs ---

export async function getAuditLogs() {
    await requireSession(["ADMIN"])

    return await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100,
        include: {
            user: {
                select: { name: true, userlogin: true }
            }
        }
    })
}
