import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { logTime, updateEntry, deleteEntry, getTimesheetEntries } from '@/app/actions'
import { mockDevSession } from '../mocks/session'
import { addDays, endOfMonth, subMonths } from 'date-fns'

// Type the mocked functions
const mockGetServerSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('Timesheet Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('logTime', () => {
        it('should throw error if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            await expect(
                logTime({
                    projectId: 'project-1',
                    date: new Date(),
                    hours: 2,
                    description: 'Test work',
                })
            ).rejects.toThrow('Unauthorized')
        })

        it('should create timesheet entry when valid', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([])
            mockPrisma.timesheetEntry.create.mockResolvedValue({
                id: 'entry-1',
                userId: mockDevSession.user.id,
                projectId: 'project-1',
                date: new Date(),
                hours: 2,
                description: 'Test work',
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await logTime({
                projectId: 'project-1',
                date: new Date(),
                hours: 2,
                description: 'Test work',
            })

            expect(result.success).toBe(true)
            expect(mockPrisma.timesheetEntry.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: mockDevSession.user.id,
                    projectId: 'project-1',
                    hours: 2,
                    description: 'Test work',
                }),
            })
        })

        it('should throw error if daily limit (7h) would be exceeded', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            // Already logged 6 hours
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                { id: 'entry-1', hours: 6, userId: mockDevSession.user.id, projectId: 'p1', date: new Date(), description: '', createdAt: new Date(), updatedAt: new Date() },
            ])

            await expect(
                logTime({
                    projectId: 'project-1',
                    date: new Date(),
                    hours: 2, // Would make total 8h
                    description: 'Test work',
                })
            ).rejects.toThrow(/Daily limit exceeded/)
        })

        it('should allow entry when total equals exactly 7 hours', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            // Already logged 5 hours
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([
                { id: 'entry-1', hours: 5, userId: mockDevSession.user.id, projectId: 'p1', date: new Date(), description: '', createdAt: new Date(), updatedAt: new Date() },
            ])
            mockPrisma.timesheetEntry.create.mockResolvedValue({
                id: 'entry-2',
                userId: mockDevSession.user.id,
                projectId: 'project-1',
                date: new Date(),
                hours: 2,
                description: 'Test work',
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await logTime({
                projectId: 'project-1',
                date: new Date(),
                hours: 2, // Makes total exactly 7h
                description: 'Test work',
            })

            expect(result.success).toBe(true)
        })

        it('should throw error if period is locked (>5 days after month end)', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            // Create a date from 2 months ago (definitely locked)
            const lockedDate = subMonths(new Date(), 2)

            await expect(
                logTime({
                    projectId: 'project-1',
                    date: lockedDate,
                    hours: 2,
                    description: 'Test work',
                })
            ).rejects.toThrow(/locked/)
        })
    })

    describe('updateEntry', () => {
        it('should throw error if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            await expect(updateEntry('entry-1', { hours: 3 })).rejects.toThrow('Unauthorized')
        })

        it('should throw error if entry not found', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            mockPrisma.timesheetEntry.findUnique.mockResolvedValue(null)

            await expect(updateEntry('non-existent', { hours: 3 })).rejects.toThrow('Entry not found')
        })

        it('should throw error if user does not own the entry', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            mockPrisma.timesheetEntry.findUnique.mockResolvedValue({
                id: 'entry-1',
                userId: 'different-user-id', // Different user
                projectId: 'project-1',
                date: new Date(),
                hours: 2,
                description: 'Test',
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            await expect(updateEntry('entry-1', { hours: 3 })).rejects.toThrow('Unauthorized')
        })

        it('should update entry successfully when valid', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            const entryDate = new Date()
            mockPrisma.timesheetEntry.findUnique.mockResolvedValue({
                id: 'entry-1',
                userId: mockDevSession.user.id,
                projectId: 'project-1',
                date: entryDate,
                hours: 2,
                description: 'Original',
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            mockPrisma.timesheetEntry.findMany.mockResolvedValue([]) // No other entries
            mockPrisma.timesheetEntry.update.mockResolvedValue({
                id: 'entry-1',
                userId: mockDevSession.user.id,
                projectId: 'project-1',
                date: entryDate,
                hours: 3,
                description: 'Updated',
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await updateEntry('entry-1', { hours: 3, description: 'Updated' })

            expect(result.success).toBe(true)
            expect(mockPrisma.timesheetEntry.update).toHaveBeenCalled()
        })
    })

    describe('deleteEntry', () => {
        it('should throw error if user is not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            await expect(deleteEntry('entry-1')).rejects.toThrow('Unauthorized')
        })

        it('should throw error if entry not found', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            mockPrisma.timesheetEntry.findUnique.mockResolvedValue(null)

            await expect(deleteEntry('non-existent')).rejects.toThrow('Entry not found')
        })

        it('should delete entry successfully when valid', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            mockPrisma.timesheetEntry.findUnique.mockResolvedValue({
                id: 'entry-1',
                userId: mockDevSession.user.id,
                projectId: 'project-1',
                date: new Date(),
                hours: 2,
                description: 'Test',
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            mockPrisma.timesheetEntry.delete.mockResolvedValue({
                id: 'entry-1',
                userId: mockDevSession.user.id,
                projectId: 'project-1',
                date: new Date(),
                hours: 2,
                description: 'Test',
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await deleteEntry('entry-1')

            expect(result.success).toBe(true)
            expect(mockPrisma.timesheetEntry.delete).toHaveBeenCalledWith({
                where: { id: 'entry-1' },
            })
        })
    })

    describe('getTimesheetEntries', () => {
        it('should return empty array if not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            const result = await getTimesheetEntries(new Date())

            expect(result).toEqual([])
        })

        it('should return entries for the authenticated user', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            const mockEntries = [
                {
                    id: 'entry-1',
                    userId: mockDevSession.user.id,
                    projectId: 'project-1',
                    date: new Date(),
                    hours: 4,
                    description: 'Work',
                    project: { id: 'project-1', name: 'Project 1', code: 'P1' },
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ]
            mockPrisma.timesheetEntry.findMany.mockResolvedValue(mockEntries)

            const result = await getTimesheetEntries(new Date())

            expect(result).toEqual(mockEntries)
            expect(mockPrisma.timesheetEntry.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: mockDevSession.user.id,
                    }),
                })
            )
        })
    })
})
