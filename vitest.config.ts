import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/**',
      ],
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
    },
    globals: true,
    typecheck: {
      enabled: true,
    },
    // E2E test configuration
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for E2E tests to avoid port conflicts
      },
    },
    // Increase timeouts for E2E tests
    testTimeout: 30000, // 30 seconds
    hookTimeout: 30000, // 30 seconds
    // Run E2E tests sequentially by default
    sequence: {
      concurrent: false, // Disable concurrent execution for E2E tests
    },
  },
});