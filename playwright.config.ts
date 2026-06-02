import { defineConfig, devices } from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

const webServer =
    process.env.PLAYWRIGHT_NO_WEBSERVER === '1'
        ? undefined
        : {
              command: 'npm run dev',
              url: baseUrl,
              reuseExistingServer: !process.env.CI,
          };

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: 'html',
    use: {
        baseURL: baseUrl,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer,
});
