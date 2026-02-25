import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AiSettingsProvider } from "./context/AiSettingsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WorldbookProvider } from "./context/WorldbookContext";
import { WallpaperProvider } from "./context/WallpaperContext";
import { IconStyleProvider } from "./context/IconStyleContext";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <WallpaperProvider>
        <IconStyleProvider>
          <WorldbookProvider>
            <AiSettingsProvider>
              <App />
            </AiSettingsProvider>
          </WorldbookProvider>
        </IconStyleProvider>
      </WallpaperProvider>
    </ThemeProvider>
  </React.StrictMode>
);


