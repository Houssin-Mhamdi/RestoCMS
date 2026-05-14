import { useEffect, useState, useCallback } from "react"
import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "./lib/auth"
import { useI18n } from "./lib/i18n"
import { useSettings } from "./lib/settings"
import { useStore, type Client } from "./lib/store"
import { loadClients, loadProducts, loadCategories, loadTables, loadReservations } from "./lib/supabase-service"
import Sidebar from "./components/Sidebar"
import TopNav from "./components/TopNav"
import Dashboard from "./components/Dashboard"
import CreateClient from "./components/CreateClient"
import SearchClient from "./components/SearchClient"
import ClientDetails from "./components/ClientDetails"
import ManageProducts from "./pages/ManageProducts"
import CategoriesPage from "./pages/CategoriesPage"
import TablesPage from "./pages/TablesPage"
import CalendarPage from "./pages/CalendarPage"
import SettingsPage from "./pages/Settings"
import StorePage from "./pages/StorePage"
import ReservationsPage from "./pages/ReservationsPage"
import CreateRestaurant from "./pages/CreateRestaurant"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Profile from "./pages/Profile"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"

function ProtectedLayout() {
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { activeRestaurant } = useSettings()
  const [dataLoading, setDataLoading] = useState(true)

  const loadData = useCallback(async (restaurantId: string) => {
    setDataLoading(true)
    try {
      const [clients, products, categories, tables, reservations] = await Promise.all([
        loadClients(restaurantId),
        loadProducts(restaurantId),
        loadCategories(restaurantId),
        loadTables(restaurantId),
        loadReservations(restaurantId),
      ])
      dispatch({ type: "LOAD_CLIENTS", payload: clients })
      dispatch({ type: "LOAD_PRODUCTS", payload: products })
      dispatch({ type: "LOAD_CATEGORIES", payload: categories })
      dispatch({ type: "LOAD_TABLES", payload: tables })
      dispatch({ type: "LOAD_RESERVATIONS", payload: reservations })
    } catch (err) {
      console.error(err)
      dispatch({ type: "LOAD_CLIENTS", payload: [] })
      dispatch({ type: "LOAD_PRODUCTS", payload: [] })
      dispatch({ type: "LOAD_CATEGORIES", payload: [] })
      dispatch({ type: "LOAD_TABLES", payload: [] })
      dispatch({ type: "LOAD_RESERVATIONS", payload: [] })
    } finally {
      setDataLoading(false)
    }
  }, [dispatch])

  useEffect(() => {
    loadData(activeRestaurant.id)
  }, [activeRestaurant.id, loadData])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      if (e.key === "n") { e.preventDefault(); navigate("/create") }
      else if (e.key === "f") { e.preventDefault(); navigate("/search") }
      else if (e.key === "d") { e.preventDefault(); navigate("/") }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigate])

  const handleSelectClient = (client: Client) => {
    dispatch({ type: "SELECT_CLIENT", payload: client.id })
    dispatch({ type: "TOGGLE_RIGHT_SIDEBAR", payload: true })
  }

  const handleCloseDetails = () => {
    dispatch({ type: "TOGGLE_RIGHT_SIDEBAR", payload: false })
    setTimeout(() => dispatch({ type: "SELECT_CLIENT", payload: null }), 300)
  }

  const selectedClient = state.selectedClientId
    ? state.clients.find((c) => c.id === state.selectedClientId) || null
    : null

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-muted text-sm">{t("loading")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {state.sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        />
      )}
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          state.sidebarOpen ? "ml-64" : "ml-0 lg:ml-16"
        }`}
      >
        <TopNav />
        <main className="p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateClient />} />
            <Route
              path="/search"
              element={<SearchClient onSelectClient={handleSelectClient} />}
            />
            <Route path="/products" element={<ManageProducts />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/create-restaurant" element={<CreateRestaurant />} />
          </Routes>
        </main>
      </div>

      {selectedClient && state.rightSidebarOpen && (
        <ClientDetails
          client={selectedClient}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()
  const { t } = useI18n()

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="text-muted text-sm">{t("loading")}</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <Signup />}
      />
      <Route
        path="/forgot-password"
        element={user ? <Navigate to="/" replace /> : <ForgotPassword />}
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/profile"
        element={user ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/*"
        element={user ? <ProtectedLayout /> : <Navigate to="/login" replace />}
      />
    </Routes>
  )
}
