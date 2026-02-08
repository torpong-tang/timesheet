import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getReportData } from '@/app/report-actions'
import { mockAdminSession, mockDevSession, mockPMSession, mockGMSession } from '../mocks/session'

const mockGetServerSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('Report Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getReportData', () => {
        const validFilter = { month: '2026-02' }

        it('should throw error if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            await expect(getReportData(validFilter)).rejects.toThrow('Unauthorized')
        })

        it('should return only own data for DEV role', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                {
                    id: '1',
                    date: new Date('2026-02-10'),
                    hours: 4,
                    description: 'My work',
                    userId: mockDevSession.user.id,
                    projectId: 'project-1',
                    user: { name: 'Dev User', userlogin: 'dev.user' },
                    project: { name: 'Project 1', code: 'P1' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ] as any)

            const result = await getReportData(validFilter)

            expect(mockPrisma.timesheetEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: mockDevSession.user.id
                    })
                })
            )
            expect(result).toHaveLength(1)
        })

        it('should return all data for ADMIN role', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                {
                    id: '1',
                    date: new Date('2026-02-10'),
                    hours: 4,
                    description: 'Work 1',
                    userId: 'user-1',
                    projectId: 'project-1',
                    user: { name: 'User 1', userlogin: 'user1' },
                    project: { name: 'Project 1', code: 'P1' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: '2',
                    date: new Date('2026-02-11'),
                    hours: 5,
                    description: 'Work 2',
                    userId: 'user-2',
                    projectId: 'project-2',
                    user: { name: 'User 2', userlogin: 'user2' },
                    project: { name: 'Project 2', code: 'P2' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
            ] as any)

            const result = await getReportData(validFilter)

            expect(result).toHaveLength(2)
        })

        it('should return all data for GM role', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                {
                    id: '1',
                    date: new Date('2026-02-10'),
                    hours: 6,
                    description: 'Team work',
                    userId: 'user-1',
                    projectId: 'project-1',
                    user: { name: 'Team Member', userlogin: 'member1' },
                    project: { name: 'Main Project', code: 'MP1' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
            ] as any)

            const result = await getReportData(validFilter)

            expect(result).toHaveLength(1)
        })

        it('should filter by project for PM role only for assigned projects', async () => {
            mockGetServerSession.mockResolvedValue(mockPMSession)

            // PM is assigned to project-1 only
            mockPrisma.projectAssignment.findMany.mockResolvedValue([
                { id: 'a1', userId: mockPMSession.user.id, projectId: 'project-1', createdAt: new Date() }
            ])

            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                {
                    id: '1',
                    date: new Date('2026-02-10'),
                    hours: 4,
                    description: 'Assigned project work',
                    userId: 'user-1',
                    projectId: 'project-1',
                    user: { name: 'User 1', userlogin: 'user1' },
                    project: { name: 'Project 1', code: 'P1' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ] as any)

            const result = await getReportData({ month: '2026-02', projectId: 'project-1' })

            expect(mockPrisma.projectAssignment.findMany).toHaveBeenCalled()
            expect(result).toHaveLength(1)
        })

        it('should return empty for PM requesting unassigned project', async () => {
            mockGetServerSession.mockResolvedValue(mockPMSession)

            // PM is assigned to project-1 only
            mockPrisma.projectAssignment.findMany.mockResolvedValue([
                { id: 'a1', userId: mockPMSession.user.id, projectId: 'project-1', createdAt: new Date() }
            ])

            const result = await getReportData({ month: '2026-02', projectId: 'unassigned-project' })

            expect(result).toEqual([])
        })

        it('should filter by userId when provided', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                {
                    id: '1',
                    date: new Date('2026-02-10'),
                    hours: 5,
                    description: 'Specific user work',
                    userId: 'specific-user',
                    projectId: 'project-1',
                    user: { name: 'Specific User', userlogin: 'specific' },
                    project: { name: 'Project 1', code: 'P1' },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ] as any)

            await getReportData({ month: '2026-02', userId: 'specific-user' })

            expect(mockPrisma.timesheetEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'specific-user'
                    })
                })
            )
        })

        it('should parse month filter correctly', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([])

            await getReportData({ month: '2026-03' })

            expect(mockPrisma.timesheetEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        date: {
                            gte: new Date(2026, 2, 1), // March 1
                            lte: new Date(2026, 2, 31) // March 31
                        }
                    })
                })
            )
        })

        it('should combine filters (projectId + userId)', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([])

            await getReportData({ month: '2026-02', userId: 'user-1', projectId: 'project-1' })

            expect(mockPrisma.timesheetEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'user-1',
                        projectId: 'project-1'
                    })
                })
            )
        })
    })
})
