import { test, expect } from '@playwright/test';

test('Login flow for Torpong.T', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Verify we are on the login page
    await expect(page).toHaveURL(/.*login/);

    // Fill in credentials using ID selectors (more reliable here)
    await page.fill('#userlogin', 'Torpong.T');
    await page.fill('#password', 'password123');

    // Submit login form
    await page.click('button[type="submit"]');

    // Expect redirection to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
});
