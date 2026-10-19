import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Express API runs on port 3001; in development every /api request is
// proxied there.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
