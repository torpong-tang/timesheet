"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"
// import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { logAudit } from "@/lib/audit"

// --- User Management ---

export async function getUsers() {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN' && session?.user.role !== 'GM') {
        throw new Error("Unauthorized")
    }
    return await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function upsertUser(data: { id?: string, userlogin: string, name: string, email: string, role: string, password?: string, status: string }) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    if (data.id) {
        // Update
        const updateData: any = {
            userlogin: data.userlogin,
            name: data.name,
            email: data.email,
            role: data.role,
            status: data.status
        }
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10)
        }
        await prisma.user.update({
            where: { id: data.id },
            data: updateData
        })
        await logAudit("UPDATE_USER", session.user.id, `Updated user ${data.userlogin} (${data.id}) status:${data.status}`)
    } else {
        // Create
        if (!data.password) throw new Error("Password is required for new users")
        const hashedPassword = await bcrypt.hash(data.password, 10)
        await prisma.user.create({
            data: {
                userlogin: data.userlogin,
                name: data.name,
                email: data.email,
                role: data.role,
                status: data.status || "Enable",
                password: hashedPassword
            }
        })
        await logAudit("CREATE_USER", session.user.id, `Created user ${data.userlogin}`)
    }
    revalidatePath("/admin/users")
    return { success: true }
}

export async function deleteUser(id: string) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    await prisma.user.delete({ where: { id } })
    await logAudit("DELETE_USER", session.user.id, `Deleted user ${id}`)
    revalidatePath("/admin/users")
    return { success: true }
}

// --- Project Management ---

export async function getProjects() {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")
    // All roles can see projects for dropdowns, but UI might filter
    return await prisma.project.findMany({
        orderBy: { code: 'asc' }
    })
}

export async function upsertProject(data: { id?: string, code: string, name: string, startDate: Date, endDate: Date, budget?: number }) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    const payload = {
        code: data.code,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget || 0
    }

    if (data.id) {
        await prisma.project.update({
            where: { id: data.id },
            data: payload
        })
        await logAudit("UPDATE_PROJECT", session.user.id, `Updated project ${data.code}`)
    } else {
        await prisma.project.create({
            data: payload
        })
        await logAudit("CREATE_PROJECT", session.user.id, `Created project ${data.code}`)
    }
    revalidatePath("/admin/projects")
    return { success: true }
}

export async function deleteProject(id: string) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    await prisma.project.delete({ where: { id } })
    await logAudit("DELETE_PROJECT", session.user.id, `Deleted project ${id}`)
    revalidatePath("/admin/projects")
    return { success: true }
}

// --- Holiday Management ---

export async function getHolidays() {
    return await prisma.holiday.findMany({
        orderBy: { date: 'asc' }
    })
}

export async function upsertHoliday(data: { id?: string, name: string, date: Date, year: number }) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    const payload = {
        name: data.name,
        date: data.date,
        year: data.year
    }

    if (data.id) {
        await prisma.holiday.update({ where: { id: data.id }, data: payload })
        await logAudit("UPDATE_HOLIDAY", session.user.id, `Updated holiday ${data.name}`)
    } else {
        await prisma.holiday.create({ data: payload })
        await logAudit("CREATE_HOLIDAY", session.user.id, `Created holiday ${data.name}`)
    }
    revalidatePath("/admin/holidays")
    return { success: true }
}

export async function deleteHoliday(id: string) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    await prisma.holiday.delete({ where: { id } })
    await logAudit("DELETE_HOLIDAY", session.user.id, `Deleted holiday ${id}`)
    revalidatePath("/admin/holidays")
    return { success: true }
}

// --- Project Assignments ---

export async function getProjectAssignments() {
    return await prisma.projectAssignment.findMany({
        include: {
            user: true,
            project: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function assignUserToProject(userId: string, projectId: string) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    await prisma.projectAssignment.create({
        data: { userId, projectId }
    })
    await logAudit("ASSIGN_USER", session.user.id, `Assigned user ${userId} to project ${projectId}`)
    revalidatePath("/admin/assignments")
    return { success: true }
}

export async function removeUserFromProject(assignmentId: string) {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

    await prisma.projectAssignment.delete({ where: { id: assignmentId } })
    await logAudit("UNASSIGN_USER", session.user.id, `Removed assignment ${assignmentId}`)
    revalidatePath("/admin/assignments")
    return { success: true }
}

// --- Audit Logs ---

export async function getAuditLogs() {
    const session = await getServerSession(authOptions)
    if (session?.user.role !== 'ADMIN') throw new Error("Unauthorized")

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
