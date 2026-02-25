import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署在 https://用户名.github.io/wodexiaoshouji/ 下
  // 本地开发时 Vite 会自动用根路径，不受 base 影响
  base: '/wodexiaoshouji/',
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



