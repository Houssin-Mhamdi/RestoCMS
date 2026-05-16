import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { loadSubscription, createFreeSubscription, type Subscription } from "./supabase-service"
import { useAuth } from "./auth"

interface SubscriptionContextType {
  sub: Subscription | null
  loading: boolean
  canAccess: (feature: string) => boolean
  isTrialing: boolean
  isTrialExpired: boolean
  trialDaysLeft: number
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null)

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    loadSubscription()
      .then(async (s) => {
        if (!s) {
          await createFreeSubscription(user.id)
          const newSub = await loadSubscription()
          setSub(newSub)
        } else {
          setSub(s)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const trialDaysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const isTrialing = sub?.status === "trialing" && sub?.plan === "free"
  const isTrialExpired = isTrialing && trialDaysLeft === 0

  const canAccess = (feature: string): boolean => {
    if (!sub) return false
    if (isTrialExpired) return false
    if (sub.plan === "enterprise") return true
    if (sub.plan === "restaurant") {
      if (feature === "multipleRestaurants") return false
      return true
    }
    // free / trialing
    if (feature === "reservations") return false
    if (feature === "csvExport") return false
    if (feature === "calendar") return false
    if (feature === "multipleRestaurants") return false
    return true
  }

  return (
    <SubscriptionContext.Provider value={{ sub, loading, canAccess, isTrialing, isTrialExpired, trialDaysLeft }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext)
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider")
  return ctx
}
