import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useSettings } from "./settings"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { activeRestaurant, updateRestaurant } = useSettings()
  const theme: Theme = activeRestaurant.darkMode ? "dark" : "light"

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const toggle = () => {
    updateRestaurant(activeRestaurant.id, { darkMode: !activeRestaurant.darkMode })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
