import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { I18nProvider } from "./lib/i18n"
import { AuthProvider } from "./lib/auth"
import { StoreProvider } from "./lib/store"
import { SettingsProvider } from "./lib/settings"
import { ThemeProvider } from "./lib/theme"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>
          <StoreProvider>
            <SettingsProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </SettingsProvider>
          </StoreProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>
)
