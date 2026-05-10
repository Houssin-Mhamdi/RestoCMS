import { NavLink } from "react-router-dom"
import { useStore } from "../lib/store"
import { useAuth } from "../lib/auth"
import { useI18n } from "../lib/i18n"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"
import { Separator } from "./ui/separator"
import {
  LayoutDashboard,
  Users,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  UtensilsCrossed,
  Package,
  Settings,
  CalendarDays,
} from "lucide-react"

const navItems = [
  { to: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { to: "/create", labelKey: "newClient", icon: ClipboardList },
  { to: "/search", labelKey: "search", icon: Users },
  { to: "/products", labelKey: "products", icon: Package },
  { to: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { to: "/settings", labelKey: "settings", icon: Settings },
]

export default function Sidebar() {
  const { state, dispatch } = useStore()
  const { user } = useAuth()
  const { t } = useI18n()

  const closeOnMobile = () => {
    if (window.innerWidth < 1024) {
      dispatch({ type: "TOGGLE_SIDEBAR" })
    }
  }

  return (
    <>
      {state.sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeOnMobile}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full flex-col bg-sidebar-bg text-white transition-all duration-300 ${
          state.sidebarOpen ? "w-64" : "w-0 lg:w-16"
        } ${state.sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {state.sidebarOpen && (
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">RestoCMS</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            className="hidden lg:flex text-white hover:bg-sidebar-hover"
          >
            {state.sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Separator className="bg-white/10" />

        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={closeOnMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-active text-white"
                        : "text-white/80 hover:bg-sidebar-hover hover:text-white"
                    } ${!state.sidebarOpen ? "justify-center lg:flex hidden" : ""}`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {state.sidebarOpen && <span>{t(item.labelKey)}</span>}
                </NavLink>
              )
            })}
          </nav>
        </ScrollArea>

        <Separator className="bg-white/10" />
        <div className="p-4 space-y-1">
          {state.sidebarOpen && (
            <>
              <p className="text-xs text-muted">
                {state.clients.length} client
                {state.clients.length !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-muted truncate">{user?.email}</p>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
