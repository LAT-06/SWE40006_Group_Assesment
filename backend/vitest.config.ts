import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests once (non-watch), same as --run flag
    watch: false,

    // Coverage configuration — only activated when running `npm run test:coverage`
    coverage: {
      // v8 uses Node's built-in V8 coverage (zero extra native deps)
      provider: 'v8',

      // lcov  → SonarQube reads this
      // text-summary → prints a short table to Jenkins console
      reporter: ['lcov', 'text-summary'],

      // Output directory — matches sonar-project.properties
      reportsDirectory: './coverage',

      // What to include in coverage measurement
      include: ['src/**/*.ts'],

      // Exclude entry points and test files themselves
      exclude: [
        'src/**/lambda.ts',
        'src/**/start.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
