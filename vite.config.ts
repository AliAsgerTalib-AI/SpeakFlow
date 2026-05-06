import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      // Replaced at build time — key is visible in the client bundle; use a server-side proxy for production.
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY ?? ''),
      'process.env.GEMINI_MODEL': JSON.stringify(process.env.GEMINI_MODEL ?? 'gemini-2.0-flash'),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
