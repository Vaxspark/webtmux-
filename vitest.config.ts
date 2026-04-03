import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environmentMatchGlobs: [
      ['tests/web/**/*.test.tsx', 'jsdom'],
      ['tests/**/*.test.ts', 'node']
    ],
    setupFiles: ['tests/web/setup.ts']
  }
});
