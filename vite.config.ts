import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    host: 'tablia.local',
    port: 3002,
    allowedHosts: ['tablia.local'],
    cors: {
      origin: ['http://tablia.local:3002'],
    },
  },
});
