import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// 为了通过 TypeScript 校验，声明一个简化版的 process 类型（仅用于配置文件）
declare const process: { env?: { [key: string]: string | undefined } };

export default defineConfig(() => {
  // Vercel 构建时会注入 VERCEL 环境变量
  const isVercel = process.env && process.env.VERCEL === '1';

  // Vercel：部署根路径 '/'
  // GitHub Pages / 本地 Pages：部署子路径 '/wodexiaoshouji/'
  const base = isVercel ? '/' : '/wodexiaoshouji/';
  const outDir = isVercel ? 'dist' : 'docs';

  return {
    plugins: [react()],
    base,
    build: {
      outDir
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
  };
});




