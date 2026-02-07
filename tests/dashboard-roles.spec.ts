import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Dashboard Role Access', () => {
    let gmUser: any;
    let pmUser: any;
    let devUser: any;

    test.beforeAll(async () => {
        // Get latest users to ensure we use fresh seeded ones
        gmUser = await prisma.user.findFirst({ where: { role: 'GM', userlogin: { startsWith: 'GM_' } }, orderBy: { id: 'desc' } });
        pmUser = await prisma.user.findFirst({ where: { role: 'PM', userlogin: { startsWith: 'PM_' } }, orderBy: { id: 'desc' } });
        devUser = await prisma.user.findFirst({ where: { role: 'DEV', userlogin: { startsWith: 'DEV_' } }, orderBy: { id: 'desc' } });

        console.log("Using users for test:", {
            GM: gmUser?.userlogin,
            PM: pmUser?.userlogin,
            DEV: devUser?.userlogin
        });

        if (!gmUser || !pmUser || !devUser) {
            console.warn("Users not found. Seeding might be required.");
        }
    });

    test('GM should see Team Overview and Filters', async ({ page }) => {
        test.skip(!gmUser, 'No GM user found');
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        // Login as GM
        await page.goto('/login');
        await page.fill('#userlogin', gmUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
        await page.waitForTimeout(1000);

        await expect(page.getByText('Team Overview')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Filter by User')).toBeVisible();
        await expect(page.getByText('Monthly Capacity Status')).toBeVisible();
    });

    test('PM should see Team Overview', async ({ page }) => {
        test.skip(!pmUser, 'No PM user found');
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        // Login as PM
        await page.goto('/login');
        await page.fill('#userlogin', pmUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
        await page.waitForTimeout(1000);

        await expect(page.getByText('Team Overview')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Filter by User')).toBeVisible();
    });

    test('Developer should NOT see Team Overview', async ({ page }) => {
        test.skip(!devUser, 'No DEV user found');
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        // Login as Dev
        await page.goto('/login');
        await page.fill('#userlogin', devUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');
        await page.waitForTimeout(1000);

        // Check absence
        await expect(page.getByText('Team Overview')).not.toBeVisible();
        await expect(page.getByText('Monthly Capacity Status')).not.toBeVisible();

        // Check presence of user elements (My Hours / dash.hours.user)
        await expect(page.getByText('My Hours')).toBeVisible();
    });

});
