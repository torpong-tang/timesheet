import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Calendar Modal Interaction', () => {
    let devUser: any;
    let project: any;

    test.beforeAll(async () => {
        // Find a DEV user
        devUser = await prisma.user.findFirst({
            where: {
                role: 'DEV',
                userlogin: { startsWith: 'DEV_' }
            },
            orderBy: { id: 'desc' }
        });

        if (!devUser) throw new Error("No DEV user found");

        // Find a project assigned to this user (or just any project if logic allows, but usually need assignment)
        // Check assignments
        const assignments = await prisma.projectAssignment.findMany({
            where: { userId: devUser.id },
            include: { project: true }
        });

        if (assignments.length === 0) {
            // Assign a project if none
            const p = await prisma.project.findFirst();
            if (p) {
                await prisma.projectAssignment.create({
                    data: { userId: devUser.id, projectId: p.id }
                });
                project = p;
            } else {
                throw new Error("No projects available to assign");
            }
        } else {
            project = assignments[0].project;
        }

        console.log(`Testing with User: ${devUser.userlogin}, Project: ${project.code}`);
    });

    test('Should be able to click and select a project in Daily Log modal', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        await page.fill('#userlogin', devUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // 2. Go to Calendar
        await page.goto('/dashboard/calendar');

        // 3. Open Modal (Click on a day button - assuming current month has days)
        // We'll click on the "15th" or similar to avoid edge cases, or just the first available day button
        // The calendar renders buttons with text for the day number.
        // Let's click the "Today" button if possible, or any day.
        // The buttons have `data-day` attribute but simple text match is easier.
        // Let's use the "+" button if it's visible (only on hover or if empty day).
        // Safest is to click a day number.
        // Wait for any day button to confirm load
        await expect(page.locator('button[data-day]').first()).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000); // Animation buffer

        // Click the first AVAILABLE (enabled) day button to open modal
        // This avoids weekends/holidays which are disabled
        // 3. Select a Day
        // Click the first AVAILABLE (enabled) day button to select it
        const enabledDay = page.locator('button[data-day]:not([disabled])').first();
        await expect(enabledDay).toBeVisible();
        await enabledDay.click();

        // 4. Open Modal by clicking the Add button in the sidebar
        // Look for the Plus icon button in the sidebar header or empty state
        // It usually has an onClick handler to setIsDialogOpen(true)
        // Let's find button with Plus icon or accessible name if available, or just the main CTA
        // In the code, it's a button with <Plus /> icon.
        // We can try finding by aria-label if it existed, but it doesn't. 
        // We can try finding the button inside the card header for schedule.
        // Or blindly click the button that opens the dialog.
        // Let's assume there is a button that opens it.
        // Locator strategy: Button containing a visible Plus icon.
        // Or simpler: text "Add New" is NOT on the button (it's icon only).
        // Let's assume the button is visible because the day is selected and not full.
        await page.locator('.lucide-plus').first().click();
        // Note: The big empty state plus is also lucide-plus.
        // The header button is also lucide-plus.
        // Clicking either works if visible.

        // Wait for Modal to appear
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText('Log Work')).toBeVisible();
        await expect(page.getByText('Log Work')).toBeVisible();

        // 5. Open Project Combobox
        // It's a button with role "combobox"
        const projectCombo = page.getByRole('combobox', { name: "Select Project" }).first();
        // Or finding by label "Project"
        await page.locator('label:has-text("Project") ~ button').click();

        // 6. Select an option by CLICK
        // The options are in a popover.
        // We look for an option containing the project code
        const option = page.getByRole('option').filter({ hasText: project.code }).first();

        await expect(option).toBeVisible();

        // Explicitly click with mouse (default)
        await option.click();

        // 7. Verify Selection
        // The combobox trigger (button) should now contain the selected text
        const triggerButton = page.locator('label:has-text("Project") ~ button');
        await expect(triggerButton).toContainText(project.code);

        // 8. Close Modal without saving
        await page.getByRole('button', { name: 'Close' }).click();
    });
});
