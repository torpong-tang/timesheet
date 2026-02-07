import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Daily Log Modal - Project Dropdown', () => {
    let devUser: any;
    let projects: any[];

    test.beforeAll(async () => {
        // Find a DEV user with project assignments
        devUser = await prisma.user.findFirst({
            where: {
                role: 'DEV',
                userlogin: { startsWith: 'DEV_' }
            },
            orderBy: { id: 'desc' }
        });

        if (!devUser) throw new Error("No DEV user found for testing");

        // Find projects assigned to this user
        const assignments = await prisma.projectAssignment.findMany({
            where: { userId: devUser.id },
            include: { project: true },
            take: 5
        });

        projects = assignments.map(a => a.project);

        if (projects.length === 0) {
            // Create a project assignment if none exists
            const project = await prisma.project.findFirst();
            if (project) {
                await prisma.projectAssignment.create({
                    data: { userId: devUser.id, projectId: project.id }
                });
                projects = [project];
            }
        }

        console.log(`Testing with User: ${devUser.userlogin}`);
        console.log(`Projects available: ${projects.length}`);
        if (projects.length > 0) {
            console.log(`First project: ${projects[0].code} - ${projects[0].name}`);
        }
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test('Project dropdown should show list of projects', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('#userlogin', devUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // 2. Go to Calendar
        await page.goto('/dashboard/calendar');

        // 3. Wait for calendar to load
        await expect(page.locator('button[data-day]').first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        // 4. Click on a day to select it
        const enabledDay = page.locator('button[data-day]:not([disabled])').first();
        await expect(enabledDay).toBeVisible();
        await enabledDay.click();

        // 5. Open Modal by clicking the Plus button
        await page.locator('.lucide-plus').first().click();

        // 6. Wait for Modal
        await expect(page.getByRole('dialog')).toBeVisible();

        // 7. Find and click the Project combobox
        const projectCombobox = page.getByRole('combobox').first();
        await expect(projectCombobox).toBeVisible();
        await projectCombobox.click();

        // 8. Verify dropdown is open and shows projects
        await page.waitForTimeout(500);

        // Should see the search input
        const searchInput = page.locator('[role="dialog"] input[placeholder]').first();
        await expect(searchInput).toBeVisible();

        // Should see project options (not the "No project found" message)
        if (projects.length > 0) {
            const firstProjectCode = projects[0].code;
            await expect(page.getByText(firstProjectCode)).toBeVisible();
            console.log(`✅ Project list is visible with ${firstProjectCode}`);
        }
    });

    test('Project dropdown should support search functionality', async ({ page }) => {
        test.skip(projects.length === 0, 'No projects available for testing');

        // 1. Login
        await page.goto('/login');
        await page.fill('#userlogin', devUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // 2. Go to Calendar
        await page.goto('/dashboard/calendar');

        // 3. Wait for calendar to load
        await expect(page.locator('button[data-day]').first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        // 4. Click on a day to select it
        const enabledDay = page.locator('button[data-day]:not([disabled])').first();
        await enabledDay.click();

        // 5. Open Modal
        await page.locator('.lucide-plus').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // 6. Open Project dropdown
        const projectCombobox = page.getByRole('combobox').first();
        await projectCombobox.click();
        await page.waitForTimeout(500);

        // 7. Type in search box
        const searchInput = page.locator('[role="dialog"] input[placeholder]').first();
        await expect(searchInput).toBeVisible();

        const searchQuery = projects[0].code.substring(0, 4); // First 4 chars of project code
        await searchInput.fill(searchQuery);
        console.log(`Searching for: ${searchQuery}`);

        await page.waitForTimeout(500);

        // 8. Verify filtered results contain the project
        await expect(page.getByText(projects[0].code)).toBeVisible();
        console.log(`✅ Search functionality works - found ${projects[0].code}`);
    });

    test('Project dropdown should allow selection by mouse click', async ({ page }) => {
        test.skip(projects.length === 0, 'No projects available for testing');

        // 1. Login
        await page.goto('/login');
        await page.fill('#userlogin', devUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // 2. Go to Calendar
        await page.goto('/dashboard/calendar');

        // 3. Wait for calendar and select a day
        await expect(page.locator('button[data-day]').first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        const enabledDay = page.locator('button[data-day]:not([disabled])').first();
        await enabledDay.click();

        // 4. Open Modal
        await page.locator('.lucide-plus').first().click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // 5. Open Project dropdown
        const projectCombobox = page.getByRole('combobox').first();
        await projectCombobox.click();
        await page.waitForTimeout(500);

        // 6. Find and click on a project option using MOUSE
        const projectCode = projects[0].code;
        const projectOption = page.getByRole('option').filter({ hasText: projectCode }).first();
        await expect(projectOption).toBeVisible();

        console.log(`Clicking on project: ${projectCode}`);
        await projectOption.click();

        // 7. Verify selection - dropdown should close and button should show selected project
        await page.waitForTimeout(500);
        await expect(projectCombobox).toContainText(projectCode);
        console.log(`✅ Mouse click selection successful - selected ${projectCode}`);

        // 8. Close modal - click outside or press Escape
        await page.keyboard.press('Escape');
    });
});
