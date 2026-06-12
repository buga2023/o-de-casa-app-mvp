import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/, // *.test.ts são do Vitest
  timeout: 30_000,
  expect: { timeout: 15_000 }, // 1ª compilação de rota no dev server é lenta
  use: { baseURL: process.env.BASE_URL || 'http://localhost:3000', trace: 'on-first-retry' },
  webServer: {
    // no CI o build já rodou num passo anterior; produção não tem cold start
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: 'chromium', use: { ...devices['Pixel 7'] } }],
});
