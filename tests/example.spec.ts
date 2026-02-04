import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // We might need to adjust this depending on the actual metadata of the app.
    await expect(page).toHaveTitle(/Time/);
});

test('dashboard link', async ({ page }) => {
    // If the app redirects to login, this might fail or need adjustment.
    // Assuming public access or redirect behavior for now.
    await page.goto('/');

    // Just checking if basic navigation works or main element exists
    // Adjust selector based on actual app content
    await expect(page.locator('body')).toBeVisible();
});
