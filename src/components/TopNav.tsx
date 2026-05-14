import { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../lib/auth"
import { useTheme } from "../lib/theme"
import { useI18n, type Lang } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import { useStore } from "../lib/store"
import { Button } from "./ui/button"
import ConfirmDialog from "./ConfirmDialog"
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
  Building2,
  Plus,
  Check,
  Trash2,
} from "lucide-react"

export default function TopNav() {
  const { user, signOut } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, setLang, t } = useI18n()
  const { activeRestaurant, restaurants, switchRestaurant, deleteRestaurant } = useSettings()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [restaurantOpen, setRestaurantOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const langRef = useRef<HTMLDivElement>(null)
  const restaurantRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        profileRef.current && !profileRef.current.contains(target) &&
        langRef.current && !langRef.current.contains(target) &&
        searchRef.current && !searchRef.current.contains(target) &&
        restaurantRef.current && !restaurantRef.current.contains(target)
      ) {
        setProfileOpen(false)
        setLangOpen(false)
        setRestaurantOpen(false)
      }
      if (
        searchRef.current && !searchRef.current.contains(target) &&
        mobileSearchRef.current && !mobileSearchRef.current.contains(target)
      ) {
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

  const displayName = user?.user_metadata?.name || user?.email || ""
  const avatarUrl = user?.user_metadata?.avatar_url || null
  const initials = displayName.substring(0, 2).toUpperCase()

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
        results.push({ label: p.name, sublabel: `${p.price} ${activeRestaurant.currency}`, to: "/products", icon: Package })
      }
    }

    for (const c of state.clients) {
      for (const o of c.orders) {
        const itemNames = o.items.map((i) => i.name).join(", ")
        if (itemNames.toLowerCase().includes(q) || `${c.name} ${c.lastname}`.toLowerCase().includes(q)) {
          results.push({
            label: `${c.name} ${c.lastname}`,
            sublabel: `${o.total.toLocaleString()} ${activeRestaurant.currency} — ${new Date(o.date).toLocaleDateString()}`,
            to: "/search",
            icon: ClipboardList,
          })
          break
        }
      }
    }

    return results.slice(0, 10)
  }, [searchQuery, state.clients, state.products, activeRestaurant.currency])

  function handleSearchSelect(to: string) {
    navigate(to)
    setSearchOpen(false)
    setSearchQuery("")
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-card px-4">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-muted hover:text-stone-700 shrink-0"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        >
          {state.sidebarOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <div className="relative shrink-0" ref={restaurantRef}>
          <button
            onClick={() => setRestaurantOpen(!restaurantOpen)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-surface-alt transition-colors text-sm font-semibold text-text max-w-[100px] sm:max-w-[140px] lg:max-w-[200px]"
          >
            {activeRestaurant.logo ? (
              <img src={activeRestaurant.logo} alt="" className="h-5 w-5 rounded object-contain shrink-0" />
            ) : (
              <Building2 className="h-4 w-4 text-primary shrink-0" />
            )}
            <span className="truncate">{activeRestaurant.name}</span>
            <svg className="h-3 w-3 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {restaurantOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-lg border border-border bg-card shadow-lg py-1">
              {restaurants.map((r) => (
                <div key={r.id} className="flex items-center group">
                  <button
                    onClick={() => { switchRestaurant(r.id); setRestaurantOpen(false) }}
                    className="flex flex-1 items-center gap-2 px-3 py-2 text-sm text-text hover:bg-surface-alt transition-colors text-left min-w-0"
                  >
                    {r.logo ? (
                      <img src={r.logo} alt="" className="h-5 w-5 rounded object-contain shrink-0" />
                    ) : (
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                    <span className="truncate flex-1">{r.name}</span>
                    {r.id === activeRestaurant.id && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.id) }}
                    className="p-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title={t("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <div className="border-t border-border my-1" />
              <button
                onClick={() => { setRestaurantOpen(false); navigate("/create-restaurant") }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-surface-alt transition-colors"
              >
                <Plus className="h-4 w-4" />
                {t("createRestaurant")}
              </button>
            </div>
          )}
        </div>

        <div className="relative hidden sm:block flex-1 max-w-xs" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
              onFocus={() => setSearchOpen(true)}
              placeholder={t("searchAll")}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {searchOpen && searchQuery.trim() && (
            <div className="absolute left-0 top-full z-30 mt-1 w-full min-w-[280px] rounded-lg border border-border bg-card shadow-lg py-1 max-h-72 overflow-y-auto">
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

        {searchOpen && (
          <div className="fixed inset-0 z-50 sm:hidden" ref={mobileSearchRef}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setSearchOpen(false); setSearchQuery("") }} />
            <div className="relative mx-4 mt-14 rounded-lg border border-border bg-card shadow-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value) }}
                  placeholder={t("searchAll")}
                  className="h-11 w-full rounded-lg border-0 bg-transparent pl-10 pr-10 text-sm text-text placeholder:text-muted focus:outline-none"
                />
                <button onClick={() => { setSearchOpen(false); setSearchQuery("") }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {searchQuery.trim() && (
                <div className="border-t border-border max-h-60 overflow-y-auto py-1">
                  {searchResults.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted">{t("noResults")}</p>
                  ) : (
                    searchResults.map((r, i) => {
                      const Icon = r.icon
                      return (
                        <button
                          key={i}
                          onClick={() => handleSearchSelect(r.to)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-surface-alt transition-colors text-left"
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
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
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
        <Button variant="ghost" size="icon" className="text-muted hover:text-stone-700 hidden sm:inline-flex">
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
            <span className="hidden sm:inline">{lang.toUpperCase()}</span>
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
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white hover:bg-primary-hover transition-colors overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
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

      <ConfirmDialog
        open={!!deleteConfirmId}
        title={t("delete")}
        message={`${t("deleteConfirm")} "${restaurants.find((r) => r.id === deleteConfirmId)?.name}" ?`}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={() => {
          if (deleteConfirmId) deleteRestaurant(deleteConfirmId)
          setDeleteConfirmId(null)
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </header>
  )
}
