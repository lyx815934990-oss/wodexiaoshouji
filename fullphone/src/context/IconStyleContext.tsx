import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export interface IconStyleState {
  /** 图标背景色（为空则使用主题默认渐变） */
  iconBgColor: string | null;
  /** 是否开启发光效果 */
  glowEnabled: boolean;
  /** 发光颜色（为空则使用主题默认粉色） */
  glowColor: string | null;
  /** 图标圆角半径（px），为空则使用默认 18px */
  borderRadius: number | null;
}

interface IconStyleContextValue extends IconStyleState {
  setIconBgColor: (value: string | null) => void;
  setGlowEnabled: (value: boolean) => void;
  setGlowColor: (value: string | null) => void;
  setBorderRadius: (value: number | null) => void;
  resetIconStyle: () => void;
}

const STORAGE_KEY = "miniOtomePhone_full_IconStyle_v1";

const defaultState: IconStyleState = {
  iconBgColor: null,
  glowEnabled: true,
  glowColor: null,
  borderRadius: null
};

const IconStyleContext = createContext<IconStyleContextValue | null>(null);

export function IconStyleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<IconStyleState>(() => {
    if (typeof window === "undefined") return defaultState;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw) as Partial<IconStyleState>;
      return {
        iconBgColor: typeof parsed.iconBgColor === "string" ? parsed.iconBgColor : null,
        glowEnabled:
          typeof parsed.glowEnabled === "boolean" ? parsed.glowEnabled : defaultState.glowEnabled,
        glowColor: typeof parsed.glowColor === "string" ? parsed.glowColor : null,
        borderRadius:
          typeof parsed.borderRadius === "number" && Number.isFinite(parsed.borderRadius)
            ? parsed.borderRadius
            : null
      };
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const value = useMemo<IconStyleContextValue>(
    () => ({
      ...state,
      setIconBgColor: (value) =>
        setState((prev) => ({
          ...prev,
          iconBgColor: value && value.trim() ? value : null
        })),
      setGlowEnabled: (value) =>
        setState((prev) => ({
          ...prev,
          glowEnabled: value
        })),
      setGlowColor: (value) =>
        setState((prev) => ({
          ...prev,
          glowColor: value && value.trim() ? value : null
        })),
      setBorderRadius: (value) =>
        setState((prev) => ({
          ...prev,
          borderRadius:
            typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(28, value)) : null
        })),
      resetIconStyle: () => setState(defaultState)
    }),
    [state]
  );

  return <IconStyleContext.Provider value={value}>{children}</IconStyleContext.Provider>;
}

export function useIconStyle() {
  const ctx = useContext(IconStyleContext);
  if (!ctx) {
    throw new Error("useIconStyle must be used within IconStyleProvider");
  }
  return ctx;
}



