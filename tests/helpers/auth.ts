import { Page, expect } from '@playwright/test';

export async function loginAsAdmin(page: Page) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#userlogin', 'Torpong.T');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard with longer timeout
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
}

export async function loginAsUser(page: Page, userlogin: string, password: string = 'password123') {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('#userlogin', userlogin);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
}
