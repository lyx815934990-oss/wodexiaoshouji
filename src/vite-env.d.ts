/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Web Push VAPID 公钥（URL-safe Base64，与 web-push 生成的一对密钥中的 public） */
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  /** 推送服务地址（默认同主机 8787 端口） */
  readonly VITE_PUSH_SERVER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
