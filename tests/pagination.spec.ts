import { test, expect } from '@playwright/test';

test.describe('Pagination Components', () => {

    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('Admin Users Page Pagination', async ({ page }) => {
        // Navigate to Users Page
        await page.goto('/admin/users');

        // Wait for loading to finish
        await expect(page.locator('text=Fetching team...')).not.toBeVisible();

        // Check "Rows per page" is 10
        await expect(page.locator('text=Rows per page')).toBeVisible();
        await expect(page.locator('button[role="combobox"]')).toHaveText('10');

        // Check Page 1 is active using strict text matching
        const page1Btn = page.locator('button').filter({ hasText: /^1$/ });
        await expect(page1Btn).toBeVisible();
        await expect(page1Btn).toHaveClass(/bg-primary text-white/);

        // Check "Next" button is enabled
        const nextBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });
        await expect(nextBtn).toBeEnabled();

        // 2. Go to Next Page
        await nextBtn.click();

        // Check Page 2 is active
        const page2Btn = page.locator('button').filter({ hasText: /^2$/ });
        await expect(page2Btn).toHaveClass(/bg-primary text-white/);

        // Check "Prev" button is enabled
        const prevBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') });
        await expect(prevBtn).toBeEnabled();

        // 3. Change Page Size to 5
        // Open the select
        await page.click('button[role="combobox"]');
        // Click option "5"
        await page.click('div[role="option"]:has-text("5")');

        // Wait for table to update (page 1 active again)
        await expect(page1Btn).toHaveClass(/bg-primary text-white/);

        // Verify we have multiple pages now
        // Find all page number buttons in the pagination strip
        // Implementation: <div className="flex items-center gap-1 mx-2"> ... buttons ... </div>
        const pageButtons = page.locator('.flex.items-center.gap-1.mx-2 button');
        const count = await pageButtons.count();
        expect(count).toBeGreaterThan(1);

        // Get the number of the last page button
        const lastPageBtn = pageButtons.last();
        const lastPageText = await lastPageBtn.innerText();
        const lastPageNum = parseInt(lastPageText);
        console.log(`Detected total pages with size 5: ${lastPageNum}`);

        expect(lastPageNum).toBeGreaterThanOrEqual(4); // At least 4 pages expected (17+ users)

        // 4. Test Last Page Button (>>)
        const lastNavBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevrons-right') });
        await lastNavBtn.click();

        // Wait for update/render
        // Should be on the detected last page
        const activeLastBtn = page.locator('button').filter({ hasText: new RegExp(`^${lastPageNum}$`) });
        await expect(activeLastBtn).toHaveClass(/bg-primary text-white/);

        // 5. Test First Page Button (<<)
        const firstBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevrons-left') });
        await firstBtn.click();

        // Should be on page 1
        await expect(page1Btn).toHaveClass(/bg-primary text-white/);
    });

    test('Reports Page Pagination (Mock Data)', async ({ page }) => {
        // Since Reports might vary, we can check basic presence
        await page.goto('/dashboard/reports');
        await page.fill('input[type="month"]', '2026-03');
        await page.click('button:has-text("Load Data")');

        // Wait for data
        await expect(page.locator('text=Found')).toBeVisible();

        // Check if there is pagination
        const foundText = await page.locator('text=Found').innerText();
        const count = parseInt(foundText.match(/\d+/)?.[0] || "0");

        if (count > 20) {
            const page1Btn = page.locator('button').filter({ hasText: /^1$/ });
            await expect(page1Btn).toBeVisible();

            const nextBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });
            await expect(nextBtn).toBeEnabled();
            await nextBtn.click();

            // Check Page 2 is active
            const page2Btn = page.locator('button').filter({ hasText: /^2$/ });
            await expect(page2Btn).toHaveClass(/bg-primary text-white/);
        }
    });

});
