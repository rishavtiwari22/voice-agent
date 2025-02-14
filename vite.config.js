import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@google/generative-ai': '/node_modules/@google/generative-ai',
    },
  },
  build: {
    rollupOptions: {
      external: ['@google/generative-ai'],
    },
  },
});
