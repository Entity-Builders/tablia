import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    publicDir: 'public',
    server: {
      host: '0.0.0.0',
      port: 3002,
      strictPort: true,
      allowedHosts: ['tablia.local', 'localhost', '127.0.0.1'],
      cors: {
        origin: ['http://tablia.local', 'http://tablia.local:3002', 'http://localhost:3002'],
      },
    },
    define: {
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.VITE_SUPABASE_SCHEMA': JSON.stringify(env.VITE_SUPABASE_SCHEMA || 'tablia'),
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      'process.env.EXPO_PUBLIC_SUPABASE_SCHEMA': JSON.stringify(env.VITE_SUPABASE_SCHEMA || 'tablia'),
      'process.env.VITE_ENTITY_BUILDERS_APP_ID': JSON.stringify(env.VITE_ENTITY_BUILDERS_APP_ID || 'tablia'),
      'process.env.EXPO_PUBLIC_ENTITY_BUILDERS_APP_ID': JSON.stringify(env.VITE_ENTITY_BUILDERS_APP_ID || 'tablia'),
      'process.env.VITE_APP_ID': JSON.stringify(env.VITE_APP_ID || 'tablia'),
      'process.env.EXPO_PUBLIC_APP_ID': JSON.stringify(env.VITE_APP_ID || 'tablia'),
    },
  };
});
