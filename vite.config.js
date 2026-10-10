import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          xlsx: ['xlsx'],
          pdfjs: ['pdfjs-dist']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
