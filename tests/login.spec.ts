import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login/');
    });

    test('TC-01: Login page should display correctly', async ({ page }) => {
        // Verify page title/heading
        await expect(page.locator('text=TIMESHEET')).toBeVisible();

        // Verify login form fields are visible
        await expect(page.locator('#userlogin')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();

        // Verify submit button is visible
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Verify logo is visible
        await expect(page.locator('img[alt="Timesheet Logo"]')).toBeVisible();
    });

    test('TC-02: Login with valid credentials (Torpong.T)', async ({ page }) => {
        // Fill in valid credentials
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'password123');

        // Submit login form
        await page.click('button[type="submit"]');

        // Expect redirection to dashboard
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

        // Verify dashboard content is displayed
        await expect(page.locator('text=Timesheet')).toBeVisible({ timeout: 10000 });
    });

    test('TC-03: Login with invalid password should show error', async ({ page }) => {
        // Fill in credentials with wrong password
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'wrongpassword');

        // Submit login form
        await page.click('button[type="submit"]');

        // Should stay on login page (not redirect to dashboard)
        await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });

    test('TC-04: Login with non-existent user should show error', async ({ page }) => {
        // Fill in non-existent user
        await page.fill('#userlogin', 'nonexistent.user');
        await page.fill('#password', 'password123');

        // Submit login form
        await page.click('button[type="submit"]');

        // Should stay on login page
        await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });

    test('TC-05: Login with empty fields should not submit', async ({ page }) => {
        // Click submit without filling in fields
        await page.click('button[type="submit"]');

        // Should remain on login page
        await expect(page).toHaveURL(/.*login/);
    });

    test('TC-06: Dashboard redirects to login when not authenticated', async ({ page }) => {
        // Try to access dashboard directly without login
        await page.goto('/dashboard/');

        // Should redirect to login page
        await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
    });

    test('TC-07: After login, user can access dashboard and see their name', async ({ page }) => {
        // Login
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

        // Verify user name is displayed on dashboard
        await expect(page.locator('text=Torpong T')).toBeVisible({ timeout: 10000 });
    });

});
