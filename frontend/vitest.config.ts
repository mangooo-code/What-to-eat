import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Standalone config for component tests, kept separate from vite.config.ts
// because that one wires up the RSC/Cloudflare pipeline used for the real app.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/tests/setup.ts'],
    include: ['app/tests/**/*.test.tsx'],
  },
});
