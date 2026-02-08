import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import {
    getUsers,
    upsertUser,
    deleteUser,
    getProjects,
    upsertProject,
    deleteProject,
} from '@/app/admin-actions'
import { mockAdminSession, mockDevSession, mockGMSession } from '../mocks/session'

// Type the mocked functions
const mockGetServerSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe('Admin Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getUsers', () => {
        it('should throw error if user is not ADMIN or GM', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            await expect(getUsers()).rejects.toThrow('Unauthorized')
        })

        it('should return users for ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            const mockUsers = [
                { id: '1', name: 'User 1', userlogin: 'user1', email: 'user1@test.com', role: 'DEV', status: 'Enable' },
                { id: '2', name: 'User 2', userlogin: 'user2', email: 'user2@test.com', role: 'PM', status: 'Enable' },
            ]
            mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)

            const result = await getUsers()

            expect(result).toEqual(mockUsers)
        })

        it('should return users for GM', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)
            const mockUsers = [{ id: '1', name: 'User 1', userlogin: 'user1', email: 'user1@test.com', role: 'DEV', status: 'Enable' }]
            mockPrisma.user.findMany.mockResolvedValue(mockUsers as any)

            const result = await getUsers()

            expect(result).toEqual(mockUsers)
        })
    })

    describe('upsertUser', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            await expect(
                upsertUser({
                    userlogin: 'newuser',
                    name: 'New User',
                    email: 'new@test.com',
                    role: 'DEV',
                    password: 'password123',
                    status: 'Enable',
                })
            ).rejects.toThrow('Unauthorized')
        })

        it('should create new user when no id provided', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.user.create.mockResolvedValue({
                id: 'new-user-id',
                userlogin: 'newuser',
                name: 'New User',
                email: 'new@test.com',
                role: 'DEV',
                status: 'Enable',
                password: 'hashed',
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await upsertUser({
                userlogin: 'newuser',
                name: 'New User',
                email: 'new@test.com',
                role: 'DEV',
                password: 'password123',
                status: 'Enable',
            })

            expect(result.success).toBe(true)
            expect(mockPrisma.user.create).toHaveBeenCalled()
        })

        it('should throw error when creating user without password', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)

            await expect(
                upsertUser({
                    userlogin: 'newuser',
                    name: 'New User',
                    email: 'new@test.com',
                    role: 'DEV',
                    status: 'Enable',
                })
            ).rejects.toThrow('Password is required for new users')
        })

        it('should update existing user when id provided', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.user.update.mockResolvedValue({
                id: 'existing-user-id',
                userlogin: 'existinguser',
                name: 'Updated Name',
                email: 'existing@test.com',
                role: 'PM',
                status: 'Enable',
                password: 'hashed',
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await upsertUser({
                id: 'existing-user-id',
                userlogin: 'existinguser',
                name: 'Updated Name',
                email: 'existing@test.com',
                role: 'PM',
                status: 'Enable',
            })

            expect(result.success).toBe(true)
            expect(mockPrisma.user.update).toHaveBeenCalled()
        })
    })

    describe('deleteUser', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            await expect(deleteUser('user-id')).rejects.toThrow('Unauthorized')
        })

        it('should delete user when ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.user.delete.mockResolvedValue({
                id: 'user-id',
                userlogin: 'deleteduser',
                name: 'Deleted User',
                email: 'deleted@test.com',
                role: 'DEV',
                status: 'Enable',
                password: 'hashed',
                image: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await deleteUser('user-id')

            expect(result.success).toBe(true)
            expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-id' } })
        })
    })

    describe('getProjects', () => {
        it('should throw error if not authenticated', async () => {
            mockGetServerSession.mockResolvedValue(null)

            await expect(getProjects()).rejects.toThrow('Unauthorized')
        })

        it('should return projects for any authenticated user', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)
            const mockProjects = [
                { id: 'p1', code: 'PROJ1', name: 'Project 1', startDate: new Date(), endDate: new Date(), budget: 1000 },
            ]
            mockPrisma.project.findMany.mockResolvedValue(mockProjects as any)

            const result = await getProjects()

            expect(result).toEqual(mockProjects)
        })
    })

    describe('upsertProject', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockDevSession)

            await expect(
                upsertProject({
                    code: 'NEW',
                    name: 'New Project',
                    startDate: new Date(),
                    endDate: new Date(),
                    budget: 1000,
                })
            ).rejects.toThrow('Unauthorized')
        })

        it('should create project when ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.project.create.mockResolvedValue({
                id: 'new-project-id',
                code: 'NEW',
                name: 'New Project',
                startDate: new Date(),
                endDate: new Date(),
                budget: 1000,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await upsertProject({
                code: 'NEW',
                name: 'New Project',
                startDate: new Date(),
                endDate: new Date(),
                budget: 1000,
            })

            expect(result.success).toBe(true)
            expect(mockPrisma.project.create).toHaveBeenCalled()
        })
    })

    describe('deleteProject', () => {
        it('should throw error if user is not ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockGMSession)

            await expect(deleteProject('project-id')).rejects.toThrow('Unauthorized')
        })

        it('should delete project when ADMIN', async () => {
            mockGetServerSession.mockResolvedValue(mockAdminSession)
            mockPrisma.project.delete.mockResolvedValue({
                id: 'project-id',
                code: 'DEL',
                name: 'Deleted Project',
                startDate: new Date(),
                endDate: new Date(),
                budget: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            })

            const result = await deleteProject('project-id')

            expect(result.success).toBe(true)
            expect(mockPrisma.project.delete).toHaveBeenCalledWith({ where: { id: 'project-id' } })
        })
    })
})
