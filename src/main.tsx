import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./lib/theme"
import { I18nProvider } from "./lib/i18n"
import { AuthProvider } from "./lib/auth"
import { StoreProvider } from "./lib/store"
import { SettingsProvider } from "./lib/settings"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <StoreProvider>
              <SettingsProvider>
                <App />
              </SettingsProvider>
            </StoreProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)
