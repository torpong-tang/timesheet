import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Admin Users Management', () => {

    test.beforeEach(async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.fill('#userlogin', 'Torpong.T');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should display User Login and Status columns', async ({ page }) => {
        await page.goto('/admin/users');
        await expect(page.locator('text=Fetching team...')).not.toBeVisible();

        // Check headers
        const headers = page.locator('thead tr th');
        await expect(headers.filter({ hasText: 'User Login' })).toBeVisible();
        await expect(headers.filter({ hasText: 'Status' })).toBeVisible();

        // Check data row content
        // Search for Torpong.T to ensure it is visible even if on page 2
        await page.fill('input[placeholder="Search users..."]', 'Torpong.T');
        await expect(page.locator('table tbody tr')).toHaveCount(1);

        const userRow = page.locator('table tbody tr').first();
        await expect(userRow).toBeVisible();
        await expect(userRow).toContainText('Torpong.T');

        // Check status cell in that row - it is the 5th column index 4
        const statusCell = userRow.locator('td').nth(4);
        await expect(statusCell).toContainText('Enable');
    });

    test('should add a new user with default Enable status', async ({ page }) => {
        await page.goto('/admin/users');

        await page.click('button:has-text("Add User")');
        await expect(page.locator('div[role="dialog"]')).toBeVisible();

        // Check default status
        const statusSelect = page.locator('div[role="dialog"] label:has-text("Status") + button');
        await expect(statusSelect).toContainText('Enable');

        // Fill form
        const randomSuffix = Math.floor(Math.random() * 10000);
        const newUserLogin = `TEST_USER_${randomSuffix}`;

        await page.fill('input[placeholder="Torpong.T"]', newUserLogin);
        await page.fill('input[placeholder="Torpong T."]', `Test User ${randomSuffix}`);
        await page.fill('input[placeholder="torpong@example.com"]', `test${randomSuffix}@example.com`);
        await page.fill('input[type="password"]', 'password123');

        // Save
        await page.click('button:has-text("Save User")');

        // Match toast more loosely or wait for it
        await expect(page.locator('text=User created')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('div[role="dialog"]')).not.toBeVisible();

        // Search for the user to confirm status
        await page.fill('input[placeholder="Search users..."]', newUserLogin);
        // Wait for filtering
        await page.waitForTimeout(1000);
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCount(1);

        const statusCell = rows.first().locator('td').nth(4);
        await expect(statusCell).toContainText('Enable');
        await expect(statusCell.locator('span')).toHaveClass(/bg-emerald-50/);

        // Cleanup
        await prisma.user.delete({ where: { userlogin: newUserLogin } }).catch(() => { });
    });

    test('should edit a user and change status to Disable', async ({ page }) => {
        const randomSuffix = Math.floor(Math.random() * 10000);
        const userLogin = `EDIT_TEST_${randomSuffix}`;

        // Create via DB
        await prisma.user.create({
            data: {
                userlogin: userLogin,
                name: `Edit Test ${randomSuffix}`,
                email: `edit${randomSuffix}@example.com`,
                role: 'DEV',
                status: 'Enable',
                password: 'hash'
            }
        });

        await page.goto('/admin/users');
        await page.fill('input[placeholder="Search users..."]', userLogin);

        // Wait for table to update
        await page.waitForTimeout(1000);
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCount(1);

        // Click Edit (Pencil icon)
        // Find the button inside the row that has Pencil icon
        await rows.first().locator('button').filter({ has: page.locator('svg.lucide-pencil') }).click();

        await expect(page.locator('div[role="dialog"]')).toBeVisible();
        await expect(page.locator('div[role="dialog"]')).toContainText('Edit User Account');

        // Change Status to Disable
        await page.click('div[role="dialog"] label:has-text("Status") + button');
        await page.click('div[role="option"]:has-text("Disable")');

        await page.click('button:has-text("Save User")');
        await expect(page.locator('text=User updated')).toBeVisible({ timeout: 5000 });

        // Verify Change
        await expect(rows.first().locator('td').nth(4)).toContainText('Disable');

        // Cleanup
        await prisma.user.delete({ where: { userlogin: userLogin } }).catch(() => { });
    });
});
