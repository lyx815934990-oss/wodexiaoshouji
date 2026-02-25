import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface AiSettingsValue {
  aiConfig: AiConfig;
  updateAiConfig: (patch: Partial<AiConfig>) => void;
}

const STORAGE_KEY = "miniOtomePhone_full_AiConfig_v1";

const defaultConfig: AiConfig = {
  baseUrl: "",
  apiKey: "",
  model: ""
};

const AiSettingsContext = createContext<AiSettingsValue | null>(null);

export function AiSettingsProvider({ children }: { children: ReactNode }) {
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    if (typeof window === "undefined") return defaultConfig;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultConfig;
      const parsed = JSON.parse(raw) as Partial<AiConfig>;
      return {
        ...defaultConfig,
        ...parsed
      };
    } catch {
      return defaultConfig;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(aiConfig));
    } catch {
      // ignore
    }
  }, [aiConfig]);

  const value = useMemo<AiSettingsValue>(
    () => ({
      aiConfig,
      updateAiConfig: (patch) =>
        setAiConfig((prev) => ({
          ...prev,
          ...patch
        }))
    }),
    [aiConfig]
  );

  return <AiSettingsContext.Provider value={value}>{children}</AiSettingsContext.Provider>;
}

export function useAiSettings() {
  const ctx = useContext(AiSettingsContext);
  if (!ctx) {
    throw new Error("useAiSettings must be used within AiSettingsProvider");
  }
  return ctx;
}


