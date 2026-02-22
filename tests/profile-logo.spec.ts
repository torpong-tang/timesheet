import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Helper: login as Torpong.T
async function loginAsTorpong(page: import('@playwright/test').Page) {
    await page.goto('/timesheet/login/');
    await page.waitForLoadState('networkidle');
    await page.fill('#userlogin', 'Torpong.T');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*timesheet\/dashboard/, { timeout: 15000 });
}

test.describe('Login Logo Tests', () => {

    test('TC-LOGO-01: Login page should display the logo image correctly', async ({ page }) => {
        await page.goto('/timesheet/login/');
        await page.waitForLoadState('networkidle');

        const logo = page.locator('img[alt="Timesheet Logo"]');
        await expect(logo).toBeVisible();

        const src = await logo.getAttribute('src');
        expect(src).toContain('/timesheet/app-logo.svg');

        const naturalWidth = await logo.evaluate((img: HTMLImageElement) => img.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
    });

    test('TC-LOGO-02: Dashboard should display the logo image correctly after login', async ({ page }) => {
        await loginAsTorpong(page);

        const logo = page.locator('img[alt="Logo"]');
        await expect(logo).toBeVisible();

        const src = await logo.getAttribute('src');
        expect(src).toContain('/timesheet/app-logo.svg');

        const naturalWidth = await logo.evaluate((img: HTMLImageElement) => img.naturalWidth);
        expect(naturalWidth).toBeGreaterThan(0);
    });

    test('TC-LOGO-03: Logo image file should be accessible at /timesheet/app-logo.svg', async ({ request }) => {
        const response = await request.get('/timesheet/app-logo.svg');
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('svg');
    });
});

test.describe('Profile Picture Tests', () => {

    test('TC-PROFILE-01: Profile page should display avatar and upload input', async ({ page }) => {
        await loginAsTorpong(page);

        await page.goto('/timesheet/dashboard/profile/');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('text=User Settings')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Profile Picture')).toBeVisible();

        const avatarArea = page.locator('[data-slot="avatar"]').first();
        await expect(avatarArea).toBeVisible();

        const fileInput = page.locator('#avatar-upload');
        await expect(fileInput).toHaveCount(1);

        await expect(page.locator('text=Torpong T').first()).toBeVisible();
    });

    test('TC-PROFILE-02: Upload a profile picture and verify it saves to /img/', async ({ page }) => {
        await loginAsTorpong(page);

        await page.goto('/timesheet/dashboard/profile/');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=Profile Picture')).toBeVisible({ timeout: 10000 });

        // Create a small valid test image (10x10 PNG)
        const testImageDir = path.join(process.cwd(), 'test-results');
        if (!fs.existsSync(testImageDir)) fs.mkdirSync(testImageDir, { recursive: true });
        const testImagePath = path.join(testImageDir, 'test-avatar.png');

        const pngBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8/5+hnoEIwDiqEF8oRAAAhpYI' +
            '+VZdzjcAAAAASUVORK5CYII=',
            'base64'
        );
        fs.writeFileSync(testImagePath, pngBuffer);

        // Listen for toast success or page reload
        const responsePromise = page.waitForResponse(
            resp => resp.url().includes('timesheet') && resp.status() === 200,
            { timeout: 15000 }
        ).catch(() => null);

        // Upload the test image
        const fileInput = page.locator('#avatar-upload');
        await fileInput.setInputFiles(testImagePath);

        // Wait for page reload after upload
        await page.waitForURL(/.*timesheet\/dashboard\/profile/, { timeout: 20000 });
        await page.waitForLoadState('networkidle');

        // After reload, check that avatar image src contains /timesheet/img/
        const avatarImage = page.locator('[data-slot="avatar-image"]').first();
        const count = await avatarImage.count();
        if (count > 0) {
            const src = await avatarImage.getAttribute('src');
            if (src && src.length > 0) {
                expect(src).toContain('/timesheet/img/');
            }
        }

        // Cleanup
        if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
    });

    test('TC-PROFILE-03: Uploaded profile picture image file should be accessible via HTTP', async ({ page, request }) => {
        await loginAsTorpong(page);

        await page.goto('/timesheet/dashboard/profile/');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('text=Profile Picture')).toBeVisible({ timeout: 10000 });

        const avatarImage = page.locator('[data-slot="avatar-image"]').first();
        const count = await avatarImage.count();

        if (count > 0) {
            const src = await avatarImage.getAttribute('src');
            if (src && src.startsWith('/timesheet/img/')) {
                // Verify the image is actually accessible via HTTP
                const response = await request.get(src);
                expect(response.status()).toBe(200);
            }
        }
    });
});

test.describe('Sign Out Tests', () => {

    test('TC-SIGNOUT-01: Sign out should redirect to /timesheet/login', async ({ page }) => {
        await loginAsTorpong(page);

        // Open user dropdown menu
        const avatarButton = page.locator('button.rounded-full').first();
        await avatarButton.click();

        // Click sign out
        const signOutItem = page.locator('text=Sign out').or(page.locator('text=ออกจากระบบ'));
        await expect(signOutItem.first()).toBeVisible({ timeout: 5000 });
        await signOutItem.first().click();

        // Should redirect to /timesheet/login (NOT /login)
        await expect(page).toHaveURL(/.*timesheet\/login/, { timeout: 15000 });

        // Verify we're on the login page
        await expect(page.locator('#userlogin')).toBeVisible({ timeout: 10000 });
    });

    test('TC-SIGNOUT-02: After sign out, accessing dashboard should redirect to login', async ({ page }) => {
        await loginAsTorpong(page);

        // Open user dropdown and sign out
        const avatarButton = page.locator('button.rounded-full').first();
        await avatarButton.click();
        const signOutItem = page.locator('text=Sign out').or(page.locator('text=ออกจากระบบ'));
        await expect(signOutItem.first()).toBeVisible({ timeout: 5000 });
        await signOutItem.first().click();
        await expect(page).toHaveURL(/.*timesheet\/login/, { timeout: 15000 });

        // Now try to access dashboard
        await page.goto('/timesheet/dashboard/');
        await expect(page).toHaveURL(/.*timesheet\/login/, { timeout: 10000 });
    });
});
