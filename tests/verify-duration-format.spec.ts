import { test, expect } from '@playwright/test';

test('Verify Duration Format (Hh Dd)', async ({ page }) => {
    // 1. Dashboard Check
    await page.goto('/login');
    await page.fill('#userlogin', 'GM_1_9328');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Check Total Hours Card on Dashboard
    // It's the big number. Text should contain "h ("
    // "7.0h (1d)"
    // Wait for data to load
    await expect(page.locator('text=Time Tracker')).not.toBeVisible(); // Just avoiding confusion
    // Wait for "Hours (This Month)" to be visible
    await expect(page.getByText('Hours (This Month)').first()).toBeVisible({ timeout: 10000 });

    // Target div specifically
    const totalHoursCard = page.locator('div.text-4xl.font-black.tracking-tight').first();
    await expect(totalHoursCard).toContainText('h (');
    const dashboardText = await totalHoursCard.innerText();
    console.log('Dashboard Duration:', dashboardText);

    // 2. Reports Page Check
    await page.goto('/dashboard/reports');
    await page.fill('input[type="month"]', '2026-03');
    await page.click('button:has-text("Load Data")');
    await expect(page.locator('text=Found')).toBeVisible();

    // Daily View Check (Last column)
    const dailyRow = page.locator('tbody tr').first();
    const dailyHours = dailyRow.locator('td').last();
    await expect(dailyHours).toContainText('h (');
    console.log('Daily Report Duration:', await dailyHours.innerText());

    // Summary View Check
    await page.click('button:has-text("Summary by Project")');
    const summaryRow = page.locator('tbody tr').first();
    const summaryHours = summaryRow.locator('td').last();
    await expect(summaryHours).toContainText('h (');
    console.log('Summary Report Duration:', await summaryHours.innerText());
});
