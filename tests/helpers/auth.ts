import { Page, expect } from '@playwright/test';

function getAdminPassword() {
    const password = process.env.E2E_ADMIN_PASSWORD;
    if (!password) {
        throw new Error('E2E_ADMIN_PASSWORD must be provided by the test environment');
    }
    return password;
}

export async function loginAsAdmin(page: Page) {
    await page.goto('/timesheet/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#userlogin', 'Torpong.T');
    await page.fill('#password', getAdminPassword());
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard with longer timeout
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
}

export async function loginAsUser(page: Page, userlogin: string, password = getAdminPassword()) {
    await page.goto('/timesheet/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#userlogin', userlogin);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
}
