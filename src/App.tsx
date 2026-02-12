import React from 'react';
import { ApiSettingsApp } from './apps/ApiSettingsApp';
import { StoryApp } from './apps/StoryApp';
import { WeChatApp } from './apps/WeChatApp';
import { AiPhoneIcon } from './icons/AiPhoneIcon';
import { ApiSettingsIcon } from './icons/ApiSettingsIcon';
import { AppearanceIcon } from './icons/AppearanceIcon';
import { StoryIcon } from './icons/StoryIcon';
import { TaobaoIcon } from './icons/TaobaoIcon';
import { WaimaiIcon } from './icons/WaimaiIcon';
import { WeiboIcon } from './icons/WeiboIcon';

type AppId =
  | 'ai'
  | 'weibo'
  | 'waimai'
  | 'taobao'
  | 'api-settings'
  | 'appearance'
  | 'story'
  | null;

export const App: React.FC = () => {
  const [activeApp, setActiveApp] = React.useState<AppId>(null);
  const [storyTitle, setStoryTitle] = React.useState('线下故事');
  const [storyHeaderActions, setStoryHeaderActions] = React.useState<{
    showBack?: boolean;
    showMore?: boolean;
    onBack?: () => void;
    onMore?: () => void;
  }>({});

  const now = React.useMemo(() => {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const date = d.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
    return { time, date };
  }, []);

  const handleOpen = (id: AppId) => {
    if (id) {
      setActiveApp(id);
    }
  };

  const handleBackToDesktop = () => {
    setActiveApp(null);
    setStoryTitle('线下故事');
    setStoryHeaderActions({});
  };

  const handleStoryBack = () => {
    if (storyHeaderActions.onBack) {
      storyHeaderActions.onBack();
    } else {
      handleBackToDesktop();
    }
  };

  const handleStoryMore = () => {
    if (storyHeaderActions.onMore) {
      storyHeaderActions.onMore();
    }
  };

  return (
    <div className="phone-shell">
      <div className="phone-inner">
        <div className="desktop">
          <div className="desktop-top">
            <div className="desktop-time">{now.time}</div>
            <div className="desktop-date">{now.date}</div>
          </div>

          <div className="desktop-grid">
            <button
              type="button"
              className="app-icon-wrapper"
              onClick={() => handleOpen('ai')}
            >
              <div className="app-icon">
                <AiPhoneIcon />
              </div>
              <span className="app-label">微信</span>
            </button>

            <button
              type="button"
              className="app-icon-wrapper"
              onClick={() => handleOpen('weibo')}
            >
              <div className="app-icon">
                <WeiboIcon />
              </div>
              <span className="app-label">微博</span>
            </button>

            <button
              type="button"
              className="app-icon-wrapper"
              onClick={() => handleOpen('waimai')}
            >
              <div className="app-icon">
                <TaobaoIcon />
              </div>
              <span className="app-label">外卖</span>
            </button>

            <button
              type="button"
              className="app-icon-wrapper"
              onClick={() => handleOpen('taobao')}
            >
              <div className="app-icon">
                <WaimaiIcon />
              </div>
              <span className="app-label">淘宝</span>
            </button>

            <button
              type="button"
              className="app-icon-wrapper"
              onClick={() => handleOpen('api-settings')}
            >
              <div className="app-icon">
                <ApiSettingsIcon />
              </div>
              <span className="app-label">API设置</span>
            </button>

            <button
              type="button"
              className="app-icon-wrapper"
              onClick={() => handleOpen('appearance')}
            >
              <div className="app-icon">
                <AppearanceIcon />
              </div>
              <span className="app-label">外观</span>
            </button>

            <button
              type="button"
              className="app-icon-wrapper"
              onClick={() => handleOpen('story')}
            >
              <div className="app-icon">
                <StoryIcon />
              </div>
              <span className="app-label">线下故事</span>
            </button>
          </div>
        </div>

        {activeApp &&
          (activeApp === 'ai' ? (
            <div className="app-window app-window-full">
              <WeChatApp onExit={handleBackToDesktop} />
            </div>
          ) : (
            <div className="app-window">
              <div
                className={`app-header ${activeApp === 'api-settings' || activeApp === 'story' ? 'app-header-center' : ''
                  }`}
              >
                <div>
                  {(activeApp === 'story' || activeApp === 'api-settings') && (
                    <button
                      type="button"
                      className="app-back-left"
                      onClick={activeApp === 'story' && storyHeaderActions.showBack ? handleStoryBack : handleBackToDesktop}
                    >
                      {'<'}
                    </button>
                  )}
                  <div className="app-title">
                    {activeApp === 'weibo' && '微博'}
                    {activeApp === 'waimai' && '外卖'}
                    {activeApp === 'taobao' && '淘宝'}
                    {activeApp === 'api-settings' && 'API 设置'}
                    {activeApp === 'appearance' && '外观设置'}
                    {activeApp === 'story' && storyTitle}
                  </div>
                  {activeApp !== 'story' && (
                    <div className="app-subtitle">
                      {activeApp === 'api-settings'
                        ? '管理 AI 接口地址、Key 与模型，用于全局生文功能'
                        : '即将接入的功能区域'}
                    </div>
                  )}
                </div>
                {activeApp === 'story' && storyHeaderActions.showMore && (
                  <button
                    type="button"
                    className="app-more"
                    onClick={handleStoryMore}
                  >
                    ⋯
                  </button>
                )}
                {activeApp !== 'story' && activeApp !== 'api-settings' && (
                  <button
                    type="button"
                    className="app-back"
                    onClick={handleBackToDesktop}
                  >
                    返回桌面
                  </button>
                )}
              </div>

              {activeApp === 'api-settings' ? (
                <ApiSettingsApp />
              ) : activeApp === 'story' ? (
                <StoryApp onTitleChange={setStoryTitle} onHeaderActionsChange={setStoryHeaderActions} />
              ) : (
                <div className="app-content-placeholder">
                  {activeApp === 'weibo' && '这里将是 简化版微博时间线'}
                  {activeApp === 'waimai' && '这里将是 外卖商家和点餐流程'}
                  {activeApp === 'taobao' && '这里将是 商品搜索和详情'}
                  {activeApp === 'appearance' && '这里将是 主题 / 壁纸 / 布局 等外观设置'}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};


