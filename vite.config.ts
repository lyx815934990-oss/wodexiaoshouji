import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// 如果要部署到 GitHub Pages，仓库名就是路径前缀：/wodexiaoshouji/
// 本地开发时 Vite 会自动处理这个 base，不影响你用 http://localhost:5173 访问
const base =
  process.env.GITHUB_PAGES === 'true'
    ? '/wodexiaoshouji/'
    : '/';

export default defineConfig({
  plugins: [react()],
  base,
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




