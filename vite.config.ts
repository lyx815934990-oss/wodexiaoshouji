import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// 在 Vercel 上部署时，应用直接挂在根路径 '/'，
// 在 GitHub Pages 上则挂在 '/wodexiaoshouji/' 子路径。
// 这里不用直接访问 process.env，避免本地 TS 报错，
// 而是让 Vite 在构建时通过环境变量注入一个布尔值。
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
  plugins: [react()],
  // Vercel 环境下 base 为根路径，其它环境（本地开发 / GitHub Pages）使用子路径
  base: isVercel ? '/' : '/wodexiaoshouji/',
  server: {
    host: true, // 允许局域网访问
    port: 5173,
    allowedHosts: [
      'efd99c92.natappfree.cc', // 允许 natapp 域名访问
      '.natappfree.cc' // 允许所有 natapp 子域名（如果地址会变化）
    ],
    hmr: {
      // HMR 配置：局域网访问时自动使用局域网 IP
      // 如果通过 natapp 访问，HMR 可能无法工作（需要 WebSocket 支持）
      clientPort: 5173
    }
  }
});




