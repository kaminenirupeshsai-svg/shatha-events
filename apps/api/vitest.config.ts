import { defineConfig } from 'vitest/config';

// src/config/env.ts validates process.env at import time (and exits the
// process if it's invalid), so every test needs these present *before*
// anything under src/ is imported. Vitest applies `test.env` ahead of
// loading test files, and dotenv (loaded inside env.ts) never overwrites
// variables that are already set - so these values win.
export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/shatha_events_test',
      JWT_ACCESS_SECRET: 'vitest-access-secret-needs-32-characters-min',
      JWT_REFRESH_SECRET: 'vitest-refresh-secret-needs-32-characters-min',
      CLIENT_URL: 'http://localhost:3000',
      STORAGE_DRIVER: 'local',
      EMAIL_DRIVER: 'console',
    },
  },
});
