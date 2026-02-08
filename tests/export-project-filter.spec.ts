
import { test, expect } from '@playwright/test';
import path from 'path';
import ExcelJS from 'exceljs';
import { loginAsAdmin } from './helpers/auth';

test.describe('Export Project Filter Functionality', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('should export report filtered by project correctly', async ({ page }) => {
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
            throw new Error("No data available to test export.");
        }

        // Open Project Filter Dropdown
        await page.locator('label:has-text("Project") + button').click();

        // Wait for popover to be fully open (search input visible)
        await page.getByPlaceholder('Search project...').waitFor();

        // Select the first real project option (not "All Projects")
        // "All Projects" is usually first index 0. We pick index 1.
        const projectOption = page.getByRole('option').nth(1);
        await projectOption.waitFor();

        // Since we don't have unique marker like '@' for project, index is fine as long as we confirm not "All Projects"
        const projectTextFull = await projectOption.textContent();
        // Format: "CODE - Name"
        const projectCode = projectTextFull?.split(' - ')[0].trim();
        console.log(`Selecting Project: ${projectCode}`);

        if (projectTextFull?.includes("All Projects")) {
            throw new Error("Selected option is 'All Projects'. Locator failed.");
        }

        await projectOption.click();

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

        let projectCodeColIndex = 0;
        worksheet?.getRow(1).eachCell((cell, colNumber) => {
            if (cell.text === 'Project Code') {
                projectCodeColIndex = colNumber;
            }
        });

        expect(projectCodeColIndex).toBeGreaterThan(0);

        const rowCount = worksheet?.rowCount ?? 0;
        console.log(`Checking ${rowCount - 2} rows...`);

        // Check if rows exist (at least one data row + header + total)
        expect(rowCount).toBeGreaterThan(2);

        for (let i = 2; i < rowCount; i++) {
            const row = worksheet?.getRow(i); // ExcelJS rows are 1-based
            const rowProjectCode = row?.getCell(projectCodeColIndex).text;

            if (!rowProjectCode) continue; // Skip if empty (likely Total row or formatting artifact)

            expect(rowProjectCode).toBe(projectCode);
        }
    });

});
