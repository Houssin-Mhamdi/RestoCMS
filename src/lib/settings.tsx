import { createContext, useContext, useState, type ReactNode } from "react"

export interface AppSettings {
  restaurantName: string
  currency: string
  tableCount: number
}

const DEFAULTS: AppSettings = {
  restaurantName: "RestoCMS",
  currency: "€",
  tableCount: 0,
}

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem("app_settings")
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULTS }
}

function saveSettings(s: AppSettings) {
  localStorage.setItem("app_settings", JSON.stringify(s))
}

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (s: Partial<AppSettings>) => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const updateSettings = (s: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s }
      saveSettings(next)
      return next
    })
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
