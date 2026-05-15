import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.VITE_SUPABASE_SCHEMA': JSON.stringify(env.VITE_SUPABASE_SCHEMA || 'public'),
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.EXPO_PUBLIC_SUPABASE_SCHEMA': JSON.stringify(env.VITE_SUPABASE_SCHEMA || 'public'),
    },
  };
});
