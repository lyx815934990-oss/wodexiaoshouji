// @ts-nocheck
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function safeDecodeUriPath(p: string): string {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

async function copyDirRecursive(from: string, to: string) {
  await fs.promises.mkdir(to, { recursive: true });
  const entries = await fs.promises.readdir(from, { withFileTypes: true });
  for (const ent of entries) {
    const src = path.join(from, ent.name);
    const dst = path.join(to, ent.name);
    if (ent.isDirectory()) {
      await copyDirRecursive(src, dst);
    } else if (ent.isFile()) {
      await fs.promises.copyFile(src, dst);
    }
  }
}

export default defineConfig({
  // GitHub Pages 通常是子路径部署：import.meta.env.BASE_URL 需要能正确反映子路径
  // 本地开发默认 '/'；上线在 CI 里设置 VITE_BASE_URL=/wodexiaoshouji/
  base: (process.env.VITE_BASE_URL || '/').replace(/\/?$/, '/'),
  server: {
    host: '0.0.0.0', // 监听所有网卡
    port: 5173, // 保持原端口或修改为其他
    allowedHosts: [
      'efd99c92.natappfree.cc', // 允许 natapp 域名访问
      '.natappfree.cc', // 允许所有 natapp 子域名（如果地址会变化）
      '.cpolar.top', // cpolar 内网穿透（避免 Invalid Host header）
    ],
    /** HTTPS 页面不能请求 http://IP:8787（混合内容）；开发时把 /api/push 代理到本机 push-server */
    proxy: {
      '/api/push': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      // 激活码系统：避免手机端直接访问 8788 端口（可能未映射/混合内容）
      '/api/activation': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
      '/api/admin': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
      '/api/user': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
    hmr: {
      // HMR 配置：局域网访问时自动使用局域网 IP
      // 如果通过 natapp 访问，HMR 可能无法工作（需要 WebSocket 支持）
      clientPort: 5173,
    },
  },
  // 用 Vite plugin 在 build 前拷贝
  plugins: [
    react(),
    {
      name: 'serve-root-image-in-dev',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/manifest.webmanifest', (req, res, next) => {
          try {
            const mfPath = path.join(__dirname, 'public', 'manifest.webmanifest');
            if (!fs.existsSync(mfPath) || !fs.statSync(mfPath).isFile()) return next();

            // 明确指定 charset=utf-8，避免 iOS 读取 manifest 时把中文文件名解析成乱码
            res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            fs.createReadStream(mfPath).pipe(res);
            return;
          } catch {
            return next();
          }
        });

        // 本地 dev 需要确保 /image/* 能从仓库根目录的 image/ 正确读取，
        // 否则 iOS “添加到主屏幕”会找不到 manifest/icon，回退占位图。
        server.middlewares.use('/image', (req, res, next) => {
          const urlPath = (req.url || '').split('?')[0] || '';
          // urlPath 形如 /image/主屏幕图标.png
          const rel = urlPath.startsWith('/image/') ? urlPath.slice('/image/'.length) : '';
          const decodedRel = safeDecodeUriPath(rel);
          const imgPath = path.join(__dirname, 'image', decodedRel);

          if (!decodedRel) return next();
          if (!fs.existsSync(imgPath) || !fs.statSync(imgPath).isFile()) return next();

          const ext = path.extname(imgPath).toLowerCase();
          const contentType =
            ext === '.png'
              ? 'image/png'
              : ext === '.jpg' || ext === '.jpeg'
                ? 'image/jpeg'
                : ext === '.webp'
                  ? 'image/webp'
                  : 'application/octet-stream';

          res.setHeader('Content-Type', contentType);
          fs.createReadStream(imgPath).pipe(res);
        });
      },
    } as any,
    {
      name: 'copy-root-image-to-dist',
      apply: 'build',
      async buildStart() {
        const from = path.join(__dirname, 'image');
        const to = path.join(process.cwd(), 'dist', 'image');
        try {
          if (fs.existsSync(from)) {
            await copyDirRecursive(from, to);
          }
        } catch {
          // ignore：不影响主构建，只影响图标
        }
      },
    } as any,
  ],
});



