import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { isPushSupported, registerServiceWorker } from './pushClient';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 页面加载后尝试注册 Service Worker，用于 Web Push
if (isPushSupported()) {
  // 不阻塞首屏渲染，异步注册
  registerServiceWorker().catch((err) => {
    console.error('Service Worker 注册失败:', err);
  });
}


