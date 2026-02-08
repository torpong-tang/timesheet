import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock NextAuth
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        project: {
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        projectAssignment: {
            findMany: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
        },
        timesheetEntry: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            groupBy: vi.fn(),
        },
        holiday: {
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        auditLog: {
            findMany: vi.fn(),
            create: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

// Mock audit logging
vi.mock('@/lib/audit', () => ({
    logAudit: vi.fn(),
}))

// Reset all mocks before each test
beforeEach(() => {
    vi.clearAllMocks()
})
