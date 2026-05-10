import { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/auth"
import { useTheme } from "../lib/theme"
import { useI18n, type Lang } from "../lib/i18n"
import { useStore } from "../lib/store"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
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
  Search,
  Settings,
  Users,
  Package,
  ClipboardList,
} from "lucide-react"

export default function TopNav() {
  const { user, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, setLang, t } = useI18n()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node) &&
        langRef.current &&
        !langRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false)
        setLangOpen(false)
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

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

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [] as { label: string; sublabel: string; to: string; icon: typeof User }[]
    const q = searchQuery.toLowerCase()
    const results: { label: string; sublabel: string; to: string; icon: typeof User }[] = []

    for (const c of state.clients) {
      const name = `${c.name} ${c.lastname}`
      if (name.toLowerCase().includes(q) || c.phone.includes(q) || c.location.toLowerCase().includes(q)) {
        results.push({ label: name, sublabel: c.phone, to: "/search", icon: Users })
      }
    }

    for (const p of state.products) {
      if (p.name.toLowerCase().includes(q)) {
        results.push({ label: p.name, sublabel: `${p.price} DA`, to: "/products", icon: Package })
      }
    }

    for (const c of state.clients) {
      for (const o of c.orders) {
        const itemNames = o.items.map((i) => i.name).join(", ")
        if (itemNames.toLowerCase().includes(q) || `${c.name} ${c.lastname}`.toLowerCase().includes(q)) {
          results.push({
            label: `${c.name} ${c.lastname}`,
            sublabel: `${o.total.toLocaleString()} DA — ${new Date(o.date).toLocaleDateString()}`,
            to: "/search",
            icon: ClipboardList,
          })
          break
        }
      }
    }

    return results.slice(0, 10)
  }, [searchQuery, state.clients, state.products])

  function handleSearchSelect(to: string) {
    setSearchOpen(false)
    setSearchQuery("")
    navigate(to)
  }

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
        <div className="relative hidden sm:block" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              placeholder={t("searchAll")}
              className="h-9 w-56 lg:w-72 rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {searchOpen && searchQuery.trim() && (
            <div className="absolute left-0 top-full z-30 mt-1 w-full rounded-lg border border-border bg-card shadow-lg py-1 max-h-72 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted">{t("noResults")}</p>
              ) : (
                searchResults.map((r, i) => {
                  const Icon = r.icon
                  return (
                    <button
                      key={i}
                      onClick={() => handleSearchSelect(r.to)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-muted shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{r.label}</p>
                        <p className="truncate text-xs text-muted">{r.sublabel}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="sm:hidden p-2 text-muted hover:text-stone-700"
        >
          <Search className="h-5 w-5" />
        </button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted hover:text-stone-700">
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        <Button variant="ghost" size="icon" onClick={() => navigate("/calendar")} className="text-muted hover:text-stone-700">
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
                onClick={() => { setProfileOpen(false); navigate("/profile") }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-surface-alt transition-colors"
              >
                <User className="h-4 w-4" />
                {t("profile")}
              </button>
              <button
                onClick={() => { setProfileOpen(false); navigate("/settings") }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-surface-alt transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t("settings")}
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
