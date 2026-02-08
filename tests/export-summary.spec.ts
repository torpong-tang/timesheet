
import { test, expect } from '@playwright/test';
import path from 'path';
import ExcelJS from 'exceljs';
import { loginAsAdmin } from './helpers/auth';

test.describe('Export Summary Report Functionality', () => {

    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('should export summary report correctly', async ({ page }) => {
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

        // Switch to Summary View
        await page.click('button:has-text("Summary by Project")');

        // Wait for table headers to likely change (Summary view has different headers?)
        // Daily: Date, Employee...
        // Summary: Employee, Project Name, Total Hours... (Based on Backend change I made)
        // Frontend likely updates table too? 
        // Let's assume view mode switched successfully.

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

        // Check for "Total Hours" column which exists ONLY in Summary report
        let totalHoursColIndex = 0;
        let dateColIndex = 0;

        worksheet?.getRow(1).eachCell((cell, colNumber) => {
            if (cell.text === 'Total Hours') {
                totalHoursColIndex = colNumber;
            }
            if (cell.text === 'Date') {
                dateColIndex = colNumber;
            }
        });

        // Summary Report: Should have Total Hours, Should NOT have Date
        expect(totalHoursColIndex).toBeGreaterThan(0);
        expect(dateColIndex).toBe(0); // Should be 0 (not found)

        const rowCount = worksheet?.rowCount ?? 0;
        console.log(`Checking ${rowCount - 2} rows...`);

        // Check if rows exist (at least one data row + header + total)
        expect(rowCount).toBeGreaterThan(2);
    });

});
