import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Combobox Mouse Click Functionality', () => {
    let gmUser: any;
    let teamMembers: any[];

    test.beforeAll(async () => {
        // Find a GM user who can see Team Overview
        gmUser = await prisma.user.findFirst({
            where: {
                role: 'GM',
                userlogin: { startsWith: 'GM_' }
            },
            orderBy: { id: 'desc' }
        });

        if (!gmUser) throw new Error("No GM user found for testing");

        // Find team members for filter options
        teamMembers = await prisma.user.findMany({
            take: 5,
            orderBy: { name: 'asc' }
        });

        console.log(`Testing with GM User: ${gmUser.userlogin}`);
        console.log(`Team members available: ${teamMembers.length}`);
    });

    test.afterAll(async () => {
        await prisma.$disconnect();
    });

    test('Dashboard Team Overview - Filter by User dropdown should be clickable with mouse', async ({ page }) => {
        // 1. Login as GM
        await page.goto('/login');
        await page.fill('#userlogin', gmUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // 2. Verify Team Overview section is visible
        await expect(page.getByText('Team Overview')).toBeVisible({ timeout: 10000 });

        // 3. Find the Filter by User combobox
        // It should be a button with role="combobox" inside the Team Overview section
        const filterSection = page.locator('text=Filter by User').locator('..');
        await expect(filterSection).toBeVisible();

        // Find the combobox button (it's a sibling or descendant)
        const comboboxButton = page.getByRole('combobox').first();
        await expect(comboboxButton).toBeVisible();

        // 4. Click to open the dropdown
        await comboboxButton.click();

        // 5. Wait for dropdown options to appear
        // Options are rendered as CommandItem which has role="option"
        await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });

        // 6. Get the first available option (should be "All Users" or a team member)
        const options = page.getByRole('option');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);

        // 7. Click on an option using MOUSE CLICK
        const firstOption = options.first();
        const optionText = await firstOption.textContent();
        console.log(`Clicking option: ${optionText}`);

        // This is the critical test - mouse click should work
        await firstOption.click();

        // 8. Verify dropdown closed after selection
        await expect(page.getByRole('option').first()).not.toBeVisible({ timeout: 3000 });

        // 9. Verify the combobox now shows the selected value
        // The button text should contain the selected option
        await expect(comboboxButton).toContainText(optionText?.trim() || '');

        console.log('✅ Mouse click selection successful!');
    });

    test('Dashboard Team Overview - Should be able to select different users', async ({ page }) => {
        // Skip if not enough team members
        test.skip(teamMembers.length < 2, 'Need at least 2 team members for this test');

        // 1. Login as GM
        await page.goto('/login');
        await page.fill('#userlogin', gmUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // 2. Verify Team Overview section is visible
        await expect(page.getByText('Team Overview')).toBeVisible({ timeout: 10000 });

        // 3. Open Filter by User dropdown
        const comboboxButton = page.getByRole('combobox').first();
        await comboboxButton.click();

        // 4. Wait for options
        await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5000 });

        // 5. Click on the second option (to test non-first selection)
        const options = page.getByRole('option');
        const optionCount = await options.count();

        if (optionCount >= 2) {
            const secondOption = options.nth(1);
            const optionText = await secondOption.textContent();
            console.log(`Clicking second option: ${optionText}`);

            await secondOption.click();

            // Verify dropdown closed
            await expect(page.getByRole('option').first()).not.toBeVisible({ timeout: 3000 });

            // Verify selection
            await expect(comboboxButton).toContainText(optionText?.trim() || '');
            console.log('✅ Second option selection successful!');
        }
    });

    test('Dashboard Team Overview - Search functionality in dropdown', async ({ page }) => {
        // 1. Login as GM
        await page.goto('/login');
        await page.fill('#userlogin', gmUser.userlogin);
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // 2. Verify Team Overview section is visible
        await expect(page.getByText('Team Overview')).toBeVisible({ timeout: 10000 });

        // 3. Open Filter by User dropdown
        const comboboxButton = page.getByRole('combobox').first();
        await comboboxButton.click();

        // 4. Find the search input inside the dropdown
        // The new combobox uses a standard input element
        const searchInput = page.locator('input[placeholder]').first();
        await expect(searchInput).toBeVisible();

        // 5. Type a search query (first few chars of a user name if available)
        if (teamMembers.length > 0) {
            const searchQuery = teamMembers[0].name.substring(0, 3);
            await searchInput.fill(searchQuery);
            console.log(`Searching for: ${searchQuery}`);

            // Wait for filtering
            await page.waitForTimeout(500);

            // 6. Click on the filtered result
            const filteredOptions = page.getByRole('option');
            const filteredCount = await filteredOptions.count();

            if (filteredCount > 0) {
                const firstFiltered = filteredOptions.first();
                await firstFiltered.click();
                console.log('✅ Search and click on filtered result successful!');
            }
        }
    });
});
