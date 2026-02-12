import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/wodexiaoshouji/' : '/',
  server: {
    host: true, // 允许局域网访问
    port: 5173
  }
});



