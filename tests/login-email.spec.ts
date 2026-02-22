import { test, expect } from '@playwright/test';

test.describe('Login Page - Email & Credentials Testing', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/timesheet/login/');
        await page.waitForLoadState('networkidle');
    });

    test('TC-LOGIN-01: Login page loads and displays all required elements', async ({ page }) => {
        // Verify TIMESHEET branding
        await expect(page.locator('text=TIMESHEET')).toBeVisible();

        // Verify login form fields
        await expect(page.locator('#userlogin')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();

        // Verify submit button
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Verify logo image
        await expect(page.locator('img[alt="Timesheet Logo"]')).toBeVisible();
    });

    test('TC-LOGIN-02: Login with email torpong.t@gmail.com should handle gracefully', async ({ page }) => {
        // User attempts to login with email instead of userlogin
        await page.fill('#userlogin', 'torpong.t@gmail.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');

        // Should stay on login page since email login is not supported
        // The system uses 'userlogin' field (e.g., Torpong.T), not email
        await page.waitForTimeout(3000);
        await expect(page).toHaveURL(/.*timesheet\/login/, { timeout: 10000 });
    });

    test('TC-LOGIN-03: Login with correct userlogin Torpong.T and password123', async ({ page }) => {
        // Fill in the correct userlogin credentials
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/.*timesheet\/dashboard/, { timeout: 15000 });

        // Verify dashboard content
        await expect(page.locator('text=Timesheet')).toBeVisible({ timeout: 10000 });
    });

    test('TC-LOGIN-04: Login with wrong password should show error and stay on login', async ({ page }) => {
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should stay on login page
        await page.waitForTimeout(3000);
        await expect(page).toHaveURL(/.*timesheet\/login/, { timeout: 10000 });
    });

    test('TC-LOGIN-05: Login with non-existent user should stay on login', async ({ page }) => {
        await page.fill('#userlogin', 'nobody@example.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');

        // Should stay on login page
        await page.waitForTimeout(3000);
        await expect(page).toHaveURL(/.*timesheet\/login/, { timeout: 10000 });
    });

    test('TC-LOGIN-06: Submit with empty fields should not proceed', async ({ page }) => {
        // Click submit without filling fields
        await page.click('button[type="submit"]');

        // Should remain on login page
        await expect(page).toHaveURL(/.*timesheet\/login/);

        // Fields should have required validation
        const userloginInput = page.locator('#userlogin');
        await expect(userloginInput).toHaveAttribute('required', '');
    });

    test('TC-LOGIN-07: Dashboard access without auth redirects to login', async ({ page }) => {
        // Try to access timesheet dashboard directly without login
        await page.goto('/timesheet/dashboard/');

        // Should redirect to login page
        await expect(page).toHaveURL(/.*timesheet\/login/, { timeout: 10000 });
    });

    test('TC-LOGIN-08: After successful login, user name is visible on dashboard', async ({ page }) => {
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL(/.*timesheet\/dashboard/, { timeout: 15000 });

        // Verify user name appears (seeded as "Torpong T")
        await expect(page.locator('text=Torpong T').first()).toBeVisible({ timeout: 10000 });
    });

});
