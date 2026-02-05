import { test, expect } from '@playwright/test';

test('GM Report: Toggle Summary View by Project', async ({ page }) => {
    // 1. Login as GM
    await page.goto('/login');
    await page.fill('#userlogin', 'GM_1_9328');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Navigate to Reports
    await page.goto('/dashboard/reports');

    // 3. Load Data matches seed (March 2026)
    await page.fill('input[type="month"]', '2026-03');
    await page.click('button:has-text("Load Data")');
    await expect(page.locator('text=Found')).toBeVisible({ timeout: 10000 });

    // 4. Click Toggle "Summary by Project"
    const summaryButton = page.locator('button:has-text("Summary by Project")');
    await expect(summaryButton).toBeVisible();
    await summaryButton.click();

    // 5. Verify Table Headers changed
    // In Daily view, first col is "Date". In Summary view, first col is "Employee".
    // Actually in my code:
    // Daily: Date, Employee, Project, Description, Hours
    // Summary: Employee, Project Code, Project Name, Total Hours
    const firstHeader = page.locator('th').first();
    await expect(firstHeader).toHaveText(/Employee/);

    // 6. Verify Rows
    const rows = page.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);

    // Check first row content
    const firstRow = rows.first();
    // 2nd column should be Project Code (e.g. PROJ-...)
    const projectCodeCell = firstRow.locator('td').nth(1);
    await expect(projectCodeCell).toContainText('PROJ-');

    // Last column should be Total Hours
    const hoursCell = firstRow.locator('td').last();
    // Should be a number like "12.5"
    const hoursText = await hoursCell.innerText();
    expect(parseFloat(hoursText)).toBeGreaterThan(0);

    console.log('Summary View verified successfully.');
});
