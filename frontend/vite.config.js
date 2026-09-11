import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward API calls to the Express backend during development.
      '/verifyCaptcha': 'http://localhost:4000',
      '/leaderboard': 'http://localhost:4000',
      '/stats': 'http://localhost:4000',
      '/audioCaptcha': 'http://localhost:4000',
    },
  },
});
