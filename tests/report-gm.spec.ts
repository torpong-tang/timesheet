import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('GM Report Workflow', () => {
    let gmUser: any;

    test.beforeAll(async () => {
        // Find a real GM user from the database
        gmUser = await prisma.user.findFirst({
            where: {
                role: 'GM',
                status: 'Enable'
            }
        });

        if (!gmUser) throw new Error("No GM user found in database");
        console.log(`Testing with GM User: ${gmUser.userlogin}`);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test('Month > Developer Selection > Project Filter', async ({ page }) => {
        // 1. Login as GM
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('#userlogin', gmUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

        // 2. Navigate to Reports
        await page.goto('/dashboard/reports');
        await expect(page).toHaveURL(/.*reports/);

        // 3. Select Month (March 2026 - where seed data exists)
        await page.fill('input[type="month"]', '2026-03');

        // 4. Load Data
        await page.click('button:has-text("Load Data")');

        // Wait for "Found ... records" or table to appear
        await expect(page.locator('text=Found')).toBeVisible({ timeout: 10000 });

        // 5. Verify "All Users" default state
        const rows = page.locator('tbody tr');
        await expect(rows).not.toHaveCount(0);

        // 6. Select a specific Developer
        await page.click('text=All Users >> nth=0');

        // Wait for options and select a Developer
        const devOption = page.locator('div[role="option"]:has-text("DEV")').first();
        const devName = await devOption.innerText();
        console.log(`Selecting Developer: ${devName}`);
        await devOption.click();

        // Verify User filter applied
        await expect(page.locator('tbody tr').first()).toContainText(devName.split('(')[0].trim());

        // 7. Check Project Filter (Cascading)
        await page.click('text=All Projects');

        // Select a project
        const projectOption = page.locator('div[role="option"]').nth(1);
        const projectCode = await projectOption.innerText();
        console.log(`Selecting Project: ${projectCode}`);
        await projectOption.click();

        // 8. Verify Data Filtered
        await expect(page.locator('tbody tr').first()).toContainText(projectCode);

        console.log('Test Complete: GM filtered by Month, Dev User, and Project successfully.');
    });
});
