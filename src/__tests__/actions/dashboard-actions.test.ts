import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { getDashboardStats, getTeamData, getFilters } from '@/app/dashboard-actions'
import { mockAdminSession, mockDevSession, mockGMSession, mockPMSession } from '../mocks/session'

const mockGetServerSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('Dashboard Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getDashboardStats', () => {
        it('should throw error if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            await expect(getDashboardStats()).rejects.toThrow('Unauthorized')
        })

        it('should return dashboard stats for authenticated user', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            // Mock timesheet entries for current month
            mockPrisma.timesheetEntry.findMany.mockResolvedValueOnce([
                { hours: 4, projectId: 'project-1', id: '1', userId: '', date: new Date(), description: '', createdAt: new Date(), updatedAt: new Date() },
                { hours: 3, projectId: 'project-1', id: '2', userId: '', date: new Date(), description: '', createdAt: new Date(), updatedAt: new Date() },
                { hours: 5, projectId: 'project-2', id: '3', userId: '', date: new Date(), description: '', createdAt: new Date(), updatedAt: new Date() },
            ])

            // Mock previous month entries
            mockPrisma.timesheetEntry.findMany.mockResolvedValueOnce([
                { hours: 10, projectId: 'project-1', id: '4', userId: '', date: new Date(), description: '', createdAt: new Date(), updatedAt: new Date() },
            ])

            // Mock holidays
            mockPrisma.holiday.findMany.mockResolvedValueOnce([])

            // Mock projects
            mockPrisma.project.findMany.mockResolvedValueOnce([
                { id: 'project-1', name: 'Project 1', code: 'P1', startDate: new Date(), endDate: new Date(), budget: 1000, createdAt: new Date(), updatedAt: new Date() },
                { id: 'project-2', name: 'Project 2', code: 'P2', startDate: new Date(), endDate: new Date(), budget: 2000, createdAt: new Date(), updatedAt: new Date() },
            ])

            // Mock recent activity
            mockPrisma.timesheetEntry.findMany.mockResolvedValueOnce([
                {
                    id: '1',
                    date: new Date(),
                    hours: 4,
                    description: 'Test work',
                    project: { code: 'P1' },
                    userId: mockDevSession.user.id,
                    projectId: 'project-1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
            ] as any)

            const result = await getDashboardStats()

            expect(result).toHaveProperty('totalHoursMonth')
            expect(result).toHaveProperty('totalHoursPrevMonth')
            expect(result).toHaveProperty('topProjects')
            expect(result).toHaveProperty('recentActivity')
            expect(result).toHaveProperty('workableHoursMonth')
            expect(result.totalHoursMonth).toBe(12) // 4 + 3 + 5
            expect(result.totalHoursPrevMonth).toBe(10)
        })

        it('should include projectStatus for PM role', async () => {
            mockGetServerSession.mockResolvedValue(mockPMSession)

            // Mock all required database calls
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([])
            mockPrisma.holiday.findMany.mockResolvedValue([])
            mockPrisma.project.findMany.mockResolvedValue([
                {
                    id: 'project-1',
                    name: 'Project 1',
                    code: 'P1',
                    startDate: new Date(),
                    endDate: new Date(),
                    budget: 10000,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    timesheets: [{ hours: 5 }, { hours: 3 }]
                },
            ] as any)
            mockPrisma.projectAssignment.findMany.mockResolvedValue([
                { id: 'assign-1', userId: mockPMSession.user.id, projectId: 'project-1', createdAt: new Date() }
            ])

            const result = await getDashboardStats()

            expect(result.projectStatus).toBeDefined()
        })

        it('should include projectStatus for ADMIN role', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)

            mockPrisma.timesheetEntry.findMany.mockResolvedValue([])
            mockPrisma.holiday.findMany.mockResolvedValue([])
            mockPrisma.project.findMany.mockResolvedValue([])

            const result = await getDashboardStats()

            expect(result.projectStatus).toBeDefined()
        })
    })

    describe('getTeamData', () => {
        it('should throw error if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            await expect(getTeamData(new Date())).rejects.toThrow('Unauthorized')
        })

        it('should return empty data for DEV role', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            const result = await getTeamData(new Date())

            expect(result).toEqual({ users: [], entries: [] })
        })

        it('should return team data for GM role', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                {
                    id: '1',
                    date: new Date(),
                    hours: 4,
                    description: 'Work',
                    project: { code: 'P1', name: 'Project 1' },
                    user: { name: 'John Doe', image: null },
                    userId: 'user-1',
                    projectId: 'project-1',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ] as any)

            mockPrisma.holiday.findMany.mockResolvedValue([])
            mockPrisma.user.findMany.mockResolvedValue([
                { id: 'user-1', name: 'John Doe', image: null }
            ] as any)
            mockPrisma.timesheetEntry.groupBy.mockResolvedValue([
                { userId: 'user-1', _sum: { hours: 40 } }
            ] as any)

            const result = await getTeamData(new Date())

            expect(result.users).toBeDefined()
            expect(result.entries).toBeDefined()
            expect(Array.isArray(result.users)).toBe(true)
            expect(Array.isArray(result.entries)).toBe(true)
        })

        it('should filter team data by userId', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            mockPrisma.timesheetEntry.findMany.mockResolvedValue([])
            mockPrisma.holiday.findMany.mockResolvedValue([])
            mockPrisma.user.findMany.mockResolvedValue([
                { id: 'user-1', name: 'John Doe', image: null }
            ] as any)
            mockPrisma.timesheetEntry.groupBy.mockResolvedValue([])

            const result = await getTeamData(new Date(), 'user-1')

            expect(mockPrisma.timesheetEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'user-1'
                    })
                })
            )
        })

        it('should filter team data by projectId', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            mockPrisma.timesheetEntry.findMany.mockResolvedValue([])
            mockPrisma.holiday.findMany.mockResolvedValue([])
            mockPrisma.user.findMany.mockResolvedValue([])
            mockPrisma.timesheetEntry.groupBy.mockResolvedValue([])
            mockPrisma.projectAssignment.findMany.mockResolvedValue([])

            const result = await getTeamData(new Date(), undefined, 'project-1')

            expect(mockPrisma.timesheetEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        projectId: 'project-1'
                    })
                })
            )
        })
    })

    describe('getFilters', () => {
        it('should return empty filters if not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const result = await getFilters()

            expect(result).toEqual({ users: [], projects: [] })
        })

        it('should return empty filters for DEV role', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            const result = await getFilters()

            expect(result).toEqual({ users: [], projects: [] })
        })

        it('should return all filters for ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)

            mockPrisma.project.findMany.mockResolvedValue([
                { id: 'p1', name: 'Project 1', code: 'P1' }
            ] as any)
            mockPrisma.user.findMany.mockResolvedValue([
                { id: 'u1', name: 'John', userlogin: 'john' }
            ] as any)

            const result = await getFilters()

            expect(result.projects).toHaveLength(1)
            expect(result.users).toHaveLength(1)
            expect(result.projects[0]).toEqual({ id: 'p1', name: 'Project 1', code: 'P1' })
            expect(result.users[0]).toEqual({ id: 'u1', name: 'John' })
        })

        it('should return filtered data for PM role based on assignments', async () => {
            mockGetServerSession.mockResolvedValue(mockPMSession)

            mockPrisma.projectAssignment.findMany
                .mockResolvedValueOnce([{ id: 'a1', userId: mockPMSession.user.id, projectId: 'p1', createdAt: new Date() }])
                .mockResolvedValueOnce([{ id: 'a2', userId: 'u1', projectId: 'p1', createdAt: new Date() }])

            mockPrisma.project.findMany.mockResolvedValue([
                { id: 'p1', name: 'Assigned Project', code: 'AP1' }
            ] as any)
            mockPrisma.user.findMany.mockResolvedValue([
                { id: 'u1', name: 'Team Member', userlogin: 'teammate' }
            ] as any)

            const result = await getFilters()

            expect(mockPrisma.projectAssignment.findMany).toHaveBeenCalled()
            expect(result.projects).toBeDefined()
            expect(result.users).toBeDefined()
        })
    })
})
