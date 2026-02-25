import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // 允许外部访问
    port: 5173, // 可选：指定端口
  },
  build: {
    outDir: "dist"
  }
});


