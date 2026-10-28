import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the real app in a browser: both Workers, D1 and the Durable Objects, locally, migrated and
// seeded through the engine. `just e2e` runs them; a dev server already on :3000 is reused.
export default defineConfig({
  testDir: '.',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:3000', trace: 'retain-on-failure', ...devices['Desktop Chrome'] },
  webServer: {
    command: 'just migrate-local seed && cd apps/web && bun run dev',
    cwd: '..',
    url: 'http://localhost:3000/healthz',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
