
import { test, expect } from '@playwright/test';
import path from 'path';
import ExcelJS from 'exceljs';
import { loginAsAdmin } from './helpers/auth';

test.describe('Export Report Functionality', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('should export report filtered by user correctly', async ({ page }) => {
        await page.goto('/dashboard/reports');

        // Select Month "2026-03" which has seed data
        await page.fill('input[type="month"]', '2026-03');

        await page.click('button:has-text("Load Data")');

        // Wait for data table
        const row = page.locator('table tbody tr').first();
        await row.waitFor({ state: 'visible', timeout: 30000 });

        const noData = await page.locator('text=No matching records found').isVisible();
        if (noData) {
            console.log('No data found for 2026-03, attempting current month just in case.');
            // Try current month? No, stick to failing if no data available.
            throw new Error("No data available to test export.");
        }

        // Open User Filter Dropdown
        await page.locator('label:has-text("User") + button').click();

        // Wait for popover to be fully open (search input visible)
        await page.getByPlaceholder('Search user...').waitFor();

        // Select the first real user option (containing '@')
        // This is more robust than .nth(1)
        const userOption = page.getByRole('option').filter({ hasText: /@/ }).first();
        await userOption.waitFor();

        const userTextFull = await userOption.textContent();
        const userName = userTextFull?.split(' (@')[0].trim();
        console.log(`Selecting User: ${userName}`);

        await userOption.click();

        // Click Export
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Export")');
        const download = await downloadPromise;

        // Verify download filename
        expect(download.suggestedFilename()).toContain('Timesheet_Report');

        // Verify Content
        const filePath = await download.path();
        if (!filePath) throw new Error("Download failed");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet('Timesheet Report');
        expect(worksheet).toBeDefined();

        let employeeColIndex = 0;
        worksheet?.getRow(1).eachCell((cell, colNumber) => {
            if (cell.text === 'Employee') {
                employeeColIndex = colNumber;
            }
        });

        expect(employeeColIndex).toBeGreaterThan(0);

        const rowCount = worksheet?.rowCount ?? 0;
        console.log(`Checking ${rowCount - 2} rows...`);

        // Check if rows exist (at least one data row + header + total)
        expect(rowCount).toBeGreaterThan(2);

        for (let i = 2; i < rowCount; i++) {
            const row = worksheet?.getRow(i);
            const employeeName = row?.getCell(employeeColIndex).text;

            if (!employeeName) continue;

            expect(employeeName).toBe(userName);
        }
    });

});
