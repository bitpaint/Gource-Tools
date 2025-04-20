/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Optional: Specify port for Vite dev server
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:5000', // Your backend server address
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // Optional: If backend is not HTTPS
        // rewrite: (path) => path.replace(/^\/api/, ''), // Optional: if you need to remove /api prefix
      },
    },
  },
  test: {
    globals: true, // Use Vitest globals (describe, it, expect, etc.)
    environment: 'jsdom', // Simulate browser environment for tests
    setupFiles: './src/setupTests.js', // Optional: Specify setup file if needed
    // reporters: ['verbose'], // Optional: Add custom reporters like @vitest/ui
    // coverage: { // Optional: Configure coverage
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    // },
  },
}); 