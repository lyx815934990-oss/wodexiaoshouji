import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { registerServiceWorker } from './pwaNotifications';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 尽早注册 Service Worker，确保 PWA 模式下可以接收 Web Push
if (typeof window !== 'undefined') {
  registerServiceWorker();
}


