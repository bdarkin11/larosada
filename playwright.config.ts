import { defineConfig, devices } from '@playwright/test';

/** Pruebas de punta a punta: levantan Vite en un puerto propio y manejan el juego en Chromium. */
const PUERTO = 5181;

export default defineConfig({
  testDir: 'e2e',
  // Terminan en .e2e.ts para que Vitest no las tome como pruebas suyas.
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
