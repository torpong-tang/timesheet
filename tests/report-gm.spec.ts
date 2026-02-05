import { test, expect } from '@playwright/test';

test('GM Report Workflow: Month > Developer Selection > Project Filter', async ({ page }) => {
    // 1. Login as GM
    // Using the GM user identified: GM_1_9328
    const GM_USER = 'GM_1_9328';
    const PASSWORD = 'password123';

    await page.goto('/login');
    await page.fill('#userlogin', GM_USER);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Navigate to Reports
    await page.goto('/dashboard/reports');
    await expect(page).toHaveURL(/.*reports/);

    // 3. Select Month (March 2026 - where seed data exists)
    // Label "Month"
    await page.fill('input[type="month"]', '2026-03');

    // 4. Load Data
    await page.click('button:has-text("Load Data")');

    // Wait for "Found ... records" or table to appear
    await expect(page.locator('text=Found')).toBeVisible({ timeout: 10000 });

    // 5. Verify "All Users" default state
    // Check that we have rows
    const rows = page.locator('tbody tr');
    await expect(rows).not.toHaveCount(0);

    // 6. Select a specific Developer
    // We open the User dropdown. 
    // Shadcn Select: Trigger is a button
    // We look for the Select Trigger associated with "User" label
    // The placeholder is "All Users" or current value.
    const userTrigger = page.locator('button[role="combobox"]').first(); // First one is likely User based on order in code
    // actually let's be more specific:
    // The structure is Label -> Select.
    // We can click the trigger that contains "All Users" or traverse from Label.
    // Let's assume order: User is first param, Project is second.
    // Or finds by text "All Users" inside the trigger.

    // Open User Dropdown
    await page.click('text=All Users >> nth=0'); // Click the first "All Users" trigger (User dropdown)

    // Wait for options. We want to select a Developer.
    // Since we don't know exact DEV name stablely in script (though I will have one), 
    // let's pick one that starts with "DEV".
    const devOption = page.locator('div[role="option"]:has-text("DEV")').first();
    const devName = await devOption.innerText();
    console.log(`Selecting Developer: ${devName}`);
    await devOption.click();

    // Verify User filter applied
    // The table should only show this user.
    // Check column "Employee" in the first row.
    await expect(page.locator('tbody tr').first()).toContainText(devName.split('(')[0].trim()); // Name often matches

    // 7. Check Project Filter (Cascading)
    // Now open Project dropdown.
    await page.click('text=All Projects');

    // Select a project
    const projectOption = page.locator('div[role="option"]').nth(1); // 0 is "All", 1 is first project
    const projectCode = await projectOption.innerText();
    console.log(`Selecting Project: ${projectCode}`);
    await projectOption.click();

    // 8. Verify Data Filtered
    // First row should have this project code
    // Project code is in the 3rd column (index 2) usually, or we search text in row.
    await expect(page.locator('tbody tr').first()).toContainText(projectCode);

    console.log('Test Complete: GM filtered by Month, Dev User, and Project successfully.');
});
