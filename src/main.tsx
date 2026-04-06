import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import { initAppStorage } from './storage/appStorage';
import { loadAppearanceTheme } from './appearance/appearanceTheme';
import { applyAppearanceTheme } from './appearance/applyAppearanceTheme';

const rootEl = document.getElementById('root') as HTMLElement;
const root = ReactDOM.createRoot(rootEl);

// 启动时先初始化（并迁移）本地持久化存储：localStorage -> IndexedDB KV
// 这样后续所有 getItem 都是同步读内存缓存，不会出现首屏读不到数据的问题。
(async () => {
  try {
    await initAppStorage({ migrateFromLocalStorage: true });
  } catch {
    // ignore
  }
  try {
    applyAppearanceTheme(loadAppearanceTheme());
  } catch {
    // ignore
  }
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
})();


