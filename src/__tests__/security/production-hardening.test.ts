import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { getProjectAssignments, getUsers } from "@/app/admin-actions"
import { logTime } from "@/app/actions"
import { mockAdminSession, mockDevSession } from "../mocks/session"
import { passwordSchema, timesheetInputSchema } from "@/lib/server-validation"
import {
    clearLoginFailures,
    isLoginBlocked,
    recordLoginFailure,
} from "@/lib/login-rate-limit"
import { isValidImageSignature } from "@/lib/profile-storage"

const mockGetServerSession = vi.mocked(getServerSession)
const mockPrisma = vi.mocked(prisma)

describe("production security hardening", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it("never selects password hashes for user lists", async () => {
        mockGetServerSession.mockResolvedValue(mockAdminSession)
        mockPrisma.user.findMany.mockResolvedValue([])

        await getUsers()

        const query = mockPrisma.user.findMany.mock.calls[0][0] as any
        expect(query.select).not.toHaveProperty("password")
        expect(query.select).toEqual(expect.objectContaining({ id: true, userlogin: true, status: true }))
    })

    it("requires admin access for assignment details", async () => {
        mockGetServerSession.mockResolvedValue(mockDevSession)
        await expect(getProjectAssignments()).rejects.toThrow("Unauthorized")
    })

    it("blocks normal actions until a mandatory password change is complete", async () => {
        mockGetServerSession.mockResolvedValue({
            ...mockDevSession,
            user: { ...mockDevSession.user, mustChangePassword: true },
        })

        await expect(logTime({
            projectId: "project-1",
            date: new Date(),
            hours: 2,
            description: "Must not be saved",
        })).rejects.toThrow("Password change required")
    })

    it("rejects time entries for an unassigned project", async () => {
        mockGetServerSession.mockResolvedValue(mockDevSession)
        ;(mockPrisma.projectAssignment.findFirst as any).mockResolvedValueOnce(null)

        await expect(logTime({
            projectId: "unassigned-project",
            date: new Date(),
            hours: 2,
            description: "Unauthorized project work",
        })).rejects.toThrow("not assigned")
    })

    it("rejects invalid time increments and weak passwords", () => {
        expect(timesheetInputSchema.safeParse({
            projectId: "project-1",
            date: new Date(),
            hours: 1.25,
            description: "Work",
        }).success).toBe(false)
        expect(passwordSchema.safeParse("password123").success).toBe(false)
        expect(passwordSchema.safeParse("StrongPass!123").success).toBe(true)
    })

    it("blocks a login key after repeated failures", () => {
        const key = "127.0.0.1:blocked-user"
        clearLoginFailures(key)
        for (let attempt = 0; attempt < 5; attempt += 1) recordLoginFailure(key, 1000)
        expect(isLoginBlocked(key, 1001)).toBe(true)
        clearLoginFailures(key)
    })

    it("checks image content signatures instead of trusting MIME alone", () => {
        const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        expect(isValidImageSignature(png, "image/png")).toBe(true)
        expect(isValidImageSignature(Buffer.from("not an image"), "image/png")).toBe(false)
    })
})
