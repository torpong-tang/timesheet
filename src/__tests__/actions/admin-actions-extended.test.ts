import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import {
    getHolidays,
    upsertHoliday,
    deleteHoliday,
    getProjectAssignments,
    assignUserToProject,
    removeUserFromProject,
    getAuditLogs,
} from '@/app/admin-actions'
import { mockAdminSession, mockDevSession, mockGMSession } from '../mocks/session'

const mockGetServerSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('Admin Actions - Holiday Management', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getHolidays', () => {
        it('should return all holidays ordered by date', async () => {
            const mockHolidays = [
                { id: '1', name: 'New Year', date: new Date('2026-01-01'), year: 2026, createdAt: new Date(), updatedAt: new Date() },
                { id: '2', name: 'Songkran', date: new Date('2026-04-13'), year: 2026, createdAt: new Date(), updatedAt: new Date() },
            ]
            mockPrisma.holiday.findMany.mockResolvedValue(mockHolidays)

            const result = await getHolidays()

            expect(result).toEqual(mockHolidays)
            expect(mockPrisma.holiday.findMany).toHaveBeenCalledWith({
                orderBy: { date: 'asc' }
            })
        })

        it('should return empty array when no holidays exist', async () => {
            mockPrisma.holiday.findMany.mockResolvedValue([])

            const result = await getHolidays()

            expect(result).toEqual([])
        })
    })

    describe('upsertHoliday', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            await expect(
                upsertHoliday({
                    name: 'New Holiday',
                    date: new Date('2026-05-01'),
                    year: 2026,
                })
            ).rejects.toThrow('Unauthorized')
        })

        it('should create new holiday when no id provided', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.holiday.create.mockResolvedValue({
                id: 'new-holiday-id',
                name: 'New Holiday',
                date: new Date('2026-05-01'),
                year: 2026,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await upsertHoliday({
                name: 'New Holiday',
                date: new Date('2026-05-01'),
                year: 2026,
            })

            expect(result.success).toBe(true)
            expect(mockPrisma.holiday.create).toHaveBeenCalled()
        })

        it('should update existing holiday when id provided', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.holiday.update.mockResolvedValue({
                id: 'existing-holiday-id',
                name: 'Updated Holiday',
                date: new Date('2026-05-02'),
                year: 2026,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await upsertHoliday({
                id: 'existing-holiday-id',
                name: 'Updated Holiday',
                date: new Date('2026-05-02'),
                year: 2026,
            })

            expect(result.success).toBe(true)
            expect(mockPrisma.holiday.update).toHaveBeenCalledWith({
                where: { id: 'existing-holiday-id' },
                data: expect.objectContaining({
                    name: 'Updated Holiday',
                })
            })
        })
    })

    describe('deleteHoliday', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            await expect(deleteHoliday('holiday-id')).rejects.toThrow('Unauthorized')
        })

        it('should delete holiday when ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.holiday.delete.mockResolvedValue({
                id: 'holiday-id',
                name: 'Deleted Holiday',
                date: new Date(),
                year: 2026,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await deleteHoliday('holiday-id')

            expect(result.success).toBe(true)
            expect(mockPrisma.holiday.delete).toHaveBeenCalledWith({
                where: { id: 'holiday-id' }
            })
        })
    })
})

describe('Admin Actions - Project Assignments', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getProjectAssignments', () => {
        it('should return all assignments with user and project details', async () => {
            const mockAssignments = [
                {
                    id: 'assign-1',
                    userId: 'user-1',
                    projectId: 'project-1',
                    user: { id: 'user-1', name: 'John Doe', email: 'john@test.com' },
                    project: { id: 'project-1', code: 'P1', name: 'Project 1' },
                    createdAt: new Date(),
                },
            ]
            mockPrisma.projectAssignment.findMany.mockResolvedValue(mockAssignments as any)

            const result = await getProjectAssignments()

            expect(result).toEqual(mockAssignments)
            expect(mockPrisma.projectAssignment.findMany).toHaveBeenCalledWith({
                include: {
                    user: true,
                    project: true,
                },
                orderBy: { createdAt: 'desc' }
            })
        })
    })

    describe('assignUserToProject', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            await expect(
                assignUserToProject('user-id', 'project-id')
            ).rejects.toThrow('Unauthorized')
        })

        it('should create assignment when ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.projectAssignment.create.mockResolvedValue({
                id: 'new-assign-id',
                userId: 'user-id',
                projectId: 'project-id',
                createdAt: new Date(),
            })

            const result = await assignUserToProject('user-id', 'project-id')

            expect(result.success).toBe(true)
            expect(mockPrisma.projectAssignment.create).toHaveBeenCalledWith({
                data: { userId: 'user-id', projectId: 'project-id' }
            })
        })
    })

    describe('removeUserFromProject', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            await expect(removeUserFromProject('assignment-id')).rejects.toThrow('Unauthorized')
        })

        it('should delete assignment when ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.projectAssignment.delete.mockResolvedValue({
                id: 'assignment-id',
                userId: 'user-id',
                projectId: 'project-id',
                createdAt: new Date(),
            })

            const result = await removeUserFromProject('assignment-id')

            expect(result.success).toBe(true)
            expect(mockPrisma.projectAssignment.delete).toHaveBeenCalledWith({
                where: { id: 'assignment-id' }
            })
        })
    })
})

describe('Admin Actions - Audit Logs', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getAuditLogs', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            await expect(getAuditLogs()).rejects.toThrow('Unauthorized')
        })

        it('should return audit logs when ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            const mockLogs = [
                {
                    id: 'log-1',
                    action: 'CREATE_USER',
                    details: 'Created user john.doe',
                    userId: 'admin-id',
                    timestamp: new Date(),
                    user: { name: 'Admin', userlogin: 'admin' },
                },
                {
                    id: 'log-2',
                    action: 'LOGIN_SUCCESS',
                    details: 'User logged in',
                    userId: 'user-id',
                    timestamp: new Date(),
                    user: { name: 'John', userlogin: 'john' },
                },
            ]
            mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs as any)

            const result = await getAuditLogs()

            expect(result).toEqual(mockLogs)
            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
                orderBy: { timestamp: 'desc' },
                take: 100,
                include: {
                    user: {
                        select: { name: true, userlogin: true }
                    }
                }
            })
        })

        it('should limit audit logs to 100 entries', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.auditLog.findMany.mockResolvedValue([])

            await getAuditLogs()

            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 100,
                })
            )
        })
    })
})
