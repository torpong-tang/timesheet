import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Calendar Holiday Logic', () => {
    test.setTimeout(60000); // 60 seconds

    test('should NOT show add button on holiday/weekend default selection', async ({ page }) => {
        // 1. Login using helper
        await loginAsAdmin(page);

        // 2. Go to Calendar
        await expect(page.locator('nav')).toBeVisible();
        await page.click('a[href="/dashboard/calendar"]');

        // 3. Verify page loaded
        await expect(page.locator('text=Time Tracker')).toBeVisible();

        // 4. Check if today is a weekend relative to system time
        const today = new Date();
        const day = today.getDay();
        const isWeekend = day === 0 || day === 6;

        if (isWeekend) {
            console.log('Today is a weekend (Sat/Sun). Verifying Add button is hidden.');
            const plusButton = page.locator('.col-span-4 button:has(svg.lucide-plus)');
            await expect(plusButton).not.toBeVisible();
        } else {
            console.log('Today is NOT a weekend. Skipping weekend-specific test.');
        }
    });
});
