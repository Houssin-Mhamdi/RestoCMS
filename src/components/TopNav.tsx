import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/auth"
import { useTheme } from "../lib/theme"
import { useI18n, type Lang } from "../lib/i18n"
import { useStore } from "../lib/store"
import { Button } from "./ui/button"
import {
  Bell,
  CalendarDays,
  User,
  LogOut,
  Moon,
  Sun,
  Globe,
  Menu,
  X,
} from "lucide-react"

export default function TopNav() {
  const { user, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, setLang, t } = useI18n()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node) &&
        langRef.current &&
        !langRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false)
        setLangOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??"

  const handleLogout = async () => {
    setProfileOpen(false)
    await signOut()
    navigate("/login")
  }

  const langs: { key: Lang; label: string }[] = [
    { key: "fr", label: "FR" },
    { key: "en", label: "EN" },
    { key: "de", label: "DE" },
  ]

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted hover:text-stone-700"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        >
          {state.sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted hover:text-stone-700">
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="text-muted hover:text-stone-700">
          <CalendarDays className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted hover:text-stone-700">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="relative" ref={langRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLangOpen(!langOpen)}
            className="text-xs text-muted hover:text-stone-700 gap-1"
          >
            <Globe className="h-4 w-4" />
            {lang.toUpperCase()}
          </Button>
          {langOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 w-20 rounded-lg border border-border bg-card shadow-lg py-1">
              {langs.map((l) => (
                <button
                  key={l.key}
                  onClick={() => {
                    setLang(l.key)
                    setLangOpen(false)
                  }}
                  className={`w-full px-3 py-1.5 text-xs text-left hover:bg-surface-alt ${
                    lang === l.key ? "font-bold text-primary" : "text-stone-700"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white hover:bg-primary-hover transition-colors"
          >
            {initials}
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
              <button
                onClick={() => {
                  setProfileOpen(false)
                  navigate("/profile")
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-surface-alt transition-colors"
              >
                <User className="h-4 w-4" />
                {t("profile")}
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
