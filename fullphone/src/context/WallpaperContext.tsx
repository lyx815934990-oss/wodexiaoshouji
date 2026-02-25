import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

interface WallpaperContextValue {
  /** 当前桌面壁纸 URL（可以是网络地址或 dataURL），为空则使用默认背景 */
  wallpaperUrl: string | null;
  /** 直接设置壁纸 URL */
  setWallpaperUrl: (url: string | null) => void;
  /** 清除当前自定义壁纸，恢复默认背景 */
  clearWallpaper: () => void;
}

const STORAGE_KEY = "miniOtomePhone_full_Wallpaper_v1";

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

export function WallpaperProvider({ children }: { children: ReactNode }) {
  const [wallpaperUrl, setWallpaperUrlState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw && typeof raw === "string") {
        return raw;
      }
      return null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (wallpaperUrl) {
        window.localStorage.setItem(STORAGE_KEY, wallpaperUrl);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [wallpaperUrl]);

  const value = useMemo<WallpaperContextValue>(
    () => ({
      wallpaperUrl,
      setWallpaperUrl: (url) => setWallpaperUrlState(url || null),
      clearWallpaper: () => setWallpaperUrlState(null)
    }),
    [wallpaperUrl]
  );

  return <WallpaperContext.Provider value={value}>{children}</WallpaperContext.Provider>;
}

export function useWallpaper() {
  const ctx = useContext(WallpaperContext);
  if (!ctx) {
    throw new Error("useWallpaper must be used within WallpaperProvider");
  }
  return ctx;
}



