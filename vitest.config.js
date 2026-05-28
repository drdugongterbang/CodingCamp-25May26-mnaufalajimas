import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run in a jsdom-like environment so DOM globals are available in unit tests
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
  resolve: {
    // Allow bare imports of source files under js/
    alias: {
      '/js': new URL('./js', import.meta.url).pathname,
    },
  },
});
