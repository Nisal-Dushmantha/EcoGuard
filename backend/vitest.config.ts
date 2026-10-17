import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/modules/webapp/controllers/wildlife.controller.ts',
        'src/modules/webapp/services/wildlife.service.ts',
      ],
    },
  },
});
