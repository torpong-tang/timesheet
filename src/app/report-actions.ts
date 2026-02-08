"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import ExcelJS from "exceljs"
import { format } from "date-fns"

export type ReportFilter = {
    month: string // "YYYY-MM"
    userId?: string
    projectId?: string
}

export type ReportEntry = {
    id: string
    date: Date
    hours: number
    description: string
    userId: string
    projectId: string
    user: { id: string, name: string | null, userlogin: string }
    project: { name: string, code: string }
}

export async function getReportData(filter: ReportFilter) {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw new Error("Unauthorized")

    const { role, id: currentUserId } = session.user

    // Parse Date Range
    const [year, month] = filter.month.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1) // Start of month
    const endDate = new Date(year, month, 0) // End of month (last day)

    const whereClause: any = {
        date: {
            gte: startDate,
            lte: endDate
        }
    }

    if (filter.projectId) {
        whereClause.projectId = filter.projectId
    }

    // Role-Based Filtering
    if (role === 'DEV') {
        // Devs can only see their own data
        whereClause.userId = currentUserId
    } else if (role === 'PM') {
        // PMs see data for projects they are assigned to
        // OR users fetched explicitly if filter.userId is set (but we should probably restrict that too)

        // Find projects assigned to this PM
        const assignments = await prisma.projectAssignment.findMany({
            where: { userId: currentUserId },
            select: { projectId: true }
        })
        const allowedProjectIds = assignments.map(a => a.projectId)

        if (filter.projectId) {
            // Verify access
            if (!allowedProjectIds.includes(filter.projectId)) {
                return [] // No access to this project
            }
        } else {
            // Restrict to all assigned projects
            whereClause.projectId = { in: allowedProjectIds }
        }

        if (filter.userId) {
            whereClause.userId = filter.userId
        }
    } else {
        // ADMIN or GM: Access everything
        if (filter.userId) {
            whereClause.userId = filter.userId
        }
    }

    const data = await prisma.timesheetEntry.findMany({
        where: whereClause,
        include: {
            user: { select: { id: true, name: true, userlogin: true } },
            project: { select: { name: true, code: true } }
        },
        orderBy: { date: 'asc' }
    })

    return data
}

export async function generateExcelReport(filter: ReportFilter) {
    const data = await getReportData(filter)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Timesheet Report')

    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Employee', key: 'user', width: 25 },
        { header: 'Project Code', key: 'projectCode', width: 15 },
        { header: 'Project Name', key: 'projectName', width: 30 },
        { header: 'Hours', key: 'hours', width: 10 },
        { header: 'Description', key: 'description', width: 40 },
    ]

    data.forEach(entry => {
        worksheet.addRow({
            date: format(entry.date, 'yyyy-MM-dd'),
            user: entry.user.name,
            projectCode: entry.project.code,
            projectName: entry.project.name,
            hours: entry.hours,
            description: entry.description
        })
    })

    // Total Row
    const totalHours = data.reduce((sum, item) => sum + item.hours, 0)
    worksheet.addRow(['', '', '', 'Total', totalHours, ''])
    worksheet.getRow(worksheet.lastRow!.number).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer).toString('base64')
}
