import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { useAuth } from "./auth"
import {
  loadRestaurants,
  createRestaurantOnSupabase,
  updateRestaurantOnSupabase,
  deleteRestaurantOnSupabase,
} from "./supabase-service"

export interface Restaurant {
  id: string
  name: string
  currency: string
  color: string
  logo: string
  tableCount: number
  darkMode: boolean
}

interface RestaurantsData {
  activeId: string
  list: Restaurant[]
}

const VALID_DEFAULT_ID = "00000000-0000-0000-0000-000000000000"

const DEFAULT_RESTAURANT: Restaurant = {
  id: VALID_DEFAULT_ID,
  name: "RestoCMS",
  currency: "€",
  color: "#f97316",
  logo: "",
  tableCount: 0,
  darkMode: false,
}

const STORAGE_KEY = "restocms_restaurants"

function saveToLocal(d: RestaurantsData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

function loadFromLocal(): RestaurantsData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.list?.some((r: any) => r.id === "default") || parsed.activeId === "default") {
        return migrateLegacy(parsed)
      }
      if (parsed.list?.length) return parsed
    }
    const old = localStorage.getItem("app_settings")
    if (old) {
      const oldSettings = JSON.parse(old)
      const migrated: RestaurantsData = {
        activeId: VALID_DEFAULT_ID,
        list: [{
          ...DEFAULT_RESTAURANT,
          name: oldSettings.restaurantName || DEFAULT_RESTAURANT.name,
          currency: oldSettings.currency || DEFAULT_RESTAURANT.currency,
          tableCount: oldSettings.tableCount ?? DEFAULT_RESTAURANT.tableCount,
        }],
      }
      saveToLocal(migrated)
      localStorage.removeItem("app_settings")
      return migrated
    }
  } catch {}
  return null
}

function migrateLegacy(d: RestaurantsData): RestaurantsData {
  const list = d.list.map((r) => r.id === "default" ? { ...r, id: VALID_DEFAULT_ID } : r)
  const activeId = d.activeId === "default" ? VALID_DEFAULT_ID : d.activeId
  const next = { activeId, list }
  saveToLocal(next)
  return next
}

interface SettingsContextType {
  activeRestaurant: Restaurant
  restaurants: Restaurant[]
  loading: boolean
  switchRestaurant: (id: string) => void
  updateRestaurant: (id: string, s: Partial<Restaurant>) => Promise<void>
  addRestaurant: (r: Restaurant) => Promise<void>
  deleteRestaurant: (id: string) => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [data, setData] = useState<RestaurantsData>({
    activeId: VALID_DEFAULT_ID,
    list: [DEFAULT_RESTAURANT],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadRestaurants()
      .then((dbList) => {
        if (dbList.length > 0) {
          const restaurants: Restaurant[] = dbList.map((r) => ({
            id: r.id,
            name: r.name,
            currency: r.currency,
            color: r.color,
            logo: r.logo,
            tableCount: r.table_count,
            darkMode: r.dark_mode,
          }))
          const activeId = restaurants[0].id
          const next: RestaurantsData = { activeId, list: restaurants }
          saveToLocal(next)
          setData(next)
        } else {
          const newRestaurant: Restaurant = {
            ...DEFAULT_RESTAURANT,
            id: crypto.randomUUID?.() || "resto-" + Date.now(),
          }
          createRestaurantOnSupabase({
            id: newRestaurant.id,
            name: newRestaurant.name,
            currency: newRestaurant.currency,
            color: newRestaurant.color,
            logo: newRestaurant.logo,
            tableCount: newRestaurant.tableCount,
            darkMode: newRestaurant.darkMode,
          }).then(() => loadRestaurants().then((list) => {
            if (list.length > 0) {
              const restaurants: Restaurant[] = list.map((r) => ({
                id: r.id,
                name: r.name,
                currency: r.currency,
                color: r.color,
                logo: r.logo,
                tableCount: r.table_count,
                darkMode: r.dark_mode,
              }))
              const next: RestaurantsData = { activeId: restaurants[0].id, list: restaurants }
              saveToLocal(next)
              setData(next)
            }
          })).catch(console.error)
        }
      })
      .catch((err) => console.error("Failed to load restaurants from DB:", err))
      .finally(() => setLoading(false))
  }, [user?.id])

  const activeRestaurant = data.list.find((r) => r.id === data.activeId) || data.list[0] || DEFAULT_RESTAURANT

  const switchRestaurant = useCallback((id: string) => {
    setData((prev) => {
      const next = { ...prev, activeId: id }
      saveToLocal(next)
      return next
    })
  }, [])

  const updateRestaurant = useCallback(async (id: string, s: Partial<Restaurant>) => {
    const prev = data.list.find((r) => r.id === id)
    if (!prev) return
    const updated = { ...prev, ...s }
    setData((d) => {
      const next = { ...d, list: d.list.map((r) => r.id === id ? updated : r) }
      saveToLocal(next)
      return next
    })
    try {
      await updateRestaurantOnSupabase({
        id: updated.id,
        name: updated.name,
        currency: updated.currency,
        color: updated.color,
        logo: updated.logo,
        tableCount: updated.tableCount,
        darkMode: updated.darkMode,
      })
    } catch (err) {
      console.error("Failed to sync restaurant update to DB:", err)
    }
  }, [data.list])

  const addRestaurant = useCallback(async (r: Restaurant) => {
    setData((prev) => {
      const next = { activeId: r.id, list: [...prev.list, r] }
      saveToLocal(next)
      return next
    })
    try {
      await createRestaurantOnSupabase({
        id: r.id,
        name: r.name,
        currency: r.currency,
        color: r.color,
        logo: r.logo,
        tableCount: r.tableCount,
        darkMode: r.darkMode ?? false,
      })
    } catch (err) {
      console.error("Failed to sync restaurant creation to DB:", err)
    }
  }, [])

  const deleteRestaurant = useCallback(async (id: string) => {
    const prev = data.list.find((r) => r.id === id)
    setData((prevData) => {
      const remaining = prevData.list.filter((r) => r.id !== id)
      if (remaining.length === 0) {
        const next = { activeId: VALID_DEFAULT_ID, list: [DEFAULT_RESTAURANT] }
        saveToLocal(next)
        return next
      }
      const activeId = prevData.activeId === id ? remaining[0].id : prevData.activeId
      const next = { activeId, list: remaining }
      saveToLocal(next)
      return next
    })
    if (prev) {
      try {
        await deleteRestaurantOnSupabase(id)
      } catch (err) {
        console.error("Failed to sync restaurant deletion to DB:", err)
      }
    }
  }, [data.list])

  return (
    <SettingsContext.Provider
      value={{
        activeRestaurant,
        restaurants: data.list,
        loading,
        switchRestaurant,
        updateRestaurant,
        addRestaurant,
        deleteRestaurant,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
