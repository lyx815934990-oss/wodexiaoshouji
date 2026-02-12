import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: '/wodexiaoshouji/', // GitHub Pages 需要设置 base 路径
  server: {
    host: true, // 允许局域网访问
    port: 5173
  }
});



