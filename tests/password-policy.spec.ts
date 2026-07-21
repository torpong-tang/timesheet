import { expect, test } from "@playwright/test"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const userlogin = "e2e.password.policy"
const currentPassword = "Current!Pass123"
const newPassword = "Replacement!Pass456"

test.describe("Mandatory password policy", () => {
    test.beforeAll(async () => {
        await prisma.user.upsert({
            where: { userlogin },
            update: {
                password: await bcrypt.hash(currentPassword, 12),
                status: "Enable",
                mustChangePassword: true,
                sessionVersion: { increment: 1 },
            },
            create: {
                userlogin,
                email: "e2e.password.policy@example.invalid",
                name: "Password Policy User",
                password: await bcrypt.hash(currentPassword, 12),
                role: "DEV",
                status: "Enable",
                mustChangePassword: true,
            },
        })
    })

    test.afterAll(async () => prisma.$disconnect())

    test("forces a strong password change and requires a fresh sign-in", async ({ page }) => {
        await page.goto("/timesheet/login")
        await page.fill("#userlogin", userlogin)
        await page.fill("#password", currentPassword)
        await page.getByRole("button", { name: /sign in/i }).click()

        await expect(page).toHaveURL(/\/timesheet\/change-password\/?$/)
        await page.fill("#currentPassword", currentPassword)
        await page.fill("#newPassword", newPassword)
        await page.fill("#confirmPassword", newPassword)
        await page.getByRole("button", { name: "Set Strong Password" }).click()
        await page.getByRole("button", { name: "Update password" }).click()

        await expect(page).toHaveURL(/\/timesheet\/login\/?/, { timeout: 15_000 })
        await page.fill("#userlogin", userlogin)
        await page.fill("#password", newPassword)
        await page.getByRole("button", { name: /sign in/i }).click()
        await expect(page).toHaveURL(/\/timesheet\/dashboard\/?$/, { timeout: 15_000 })
    })
})
