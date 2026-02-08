import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    timeout: 60000, // 60 seconds per test
    expect: {
        timeout: 10000, // 10 seconds for expect assertions
    },
    use: {
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        video: 'on', // Enable video recording for all tests
        actionTimeout: 15000, // 15 seconds for actions
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        // System dependencies for Firefox and WebKit are missing in this environment.
        // Uncomment these if dependencies are installed.
        /*
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
    
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        
        {
           name: 'Mobile Chrome',
           use: { ...devices['Pixel 5'] },
        },
        {
           name: 'Mobile Safari',
           use: { ...devices['iPhone 12'] },
        },
        */
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
    },
});
