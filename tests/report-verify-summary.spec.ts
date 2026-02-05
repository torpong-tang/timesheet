import { test, expect } from '@playwright/test';

test('GM Report: Verify Total Summary and Project Data for Developer', async ({ page }) => {
    // 1. Login as GM
    const GM_USER = 'GM_1_9328';
    const PASSWORD = 'password123';

    await page.goto('/login');
    await page.fill('#userlogin', GM_USER);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Navigate to Reports
    await page.goto('/dashboard/reports');

    // 3. Select Month (March 2026)
    await page.fill('input[type="month"]', '2026-03');
    await page.click('button:has-text("Load Data")');
    await expect(page.locator('text=Found')).toBeVisible({ timeout: 10000 });

    // 4. Select a specific Developer
    // Open User Dropdown
    await page.click('text=All Users >> nth=0');
    const devOption = page.locator('div[role="option"]:has-text("DEV")').first();
    const devName = await devOption.innerText();
    console.log(`Testing Summary for: ${devName}`);
    await devOption.click();

    // 5. Ensure "All Projects" is selected (Default, but verify)
    // The Project dropdown should show "All Projects"
    await expect(page.locator('button[role="combobox"]').nth(1)).toContainText('All Projects');

    // 6. Verify Totals
    // Get displayed total
    const totalDisplay = page.locator('span:has-text("Total Hours") + span');
    await expect(totalDisplay).toBeVisible();
    const displayedTotalText = await totalDisplay.innerText();
    const displayedTotal = parseFloat(displayedTotalText);

    // Calculate total from rows
    const rows = page.locator('tbody tr');
    const count = await rows.count();
    let calculatedTotal = 0;

    console.log(`Found ${count} rows.`);

    for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        // Hours is the last column (5th, index 4)
        const hoursText = await row.locator('td').nth(4).innerText();
        calculatedTotal += parseFloat(hoursText);
    }

    console.log(`Displayed: ${displayedTotal}, Calculated: ${calculatedTotal}`);

    // Allow small float diff
    expect(Math.abs(displayedTotal - calculatedTotal)).toBeLessThan(0.1);

    // 7. Verify Project grouping/presence
    // We expect to see valid project codes in column 3 (index 2)
    const firstRowProject = await rows.first().locator('td').nth(2).innerText();
    expect(firstRowProject).not.toBe('');
    console.log(`Verified Project Column data exists: ${firstRowProject}`);

});
