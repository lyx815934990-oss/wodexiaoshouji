import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// 统一使用相对路径，避免在 Vercel 根域名和 GitHub Pages 子路径下资源 404
export default defineConfig({
  plugins: [react()],
  // 相对 base，既适用于 Vercel 根路径，也适用于 GitHub Pages 子路径
  base: './',
  // ★ 关键：构建输出到 docs，GitHub Pages 已设置 main 分支 /docs 作为站点根目录
  build: {
    outDir: 'docs'
  },
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




