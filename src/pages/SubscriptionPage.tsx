import { useState, useEffect } from "react"
import { useAuth } from "../lib/auth"
import { useI18n } from "../lib/i18n"
import { loadSubscription, type Subscription } from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { CreditCard, Check, Loader2, AlertTriangle } from "lucide-react"

const STORE_URL = "https://restooline.netlify.app"

interface StripeConfig {
  publishableKey: string
  priceRestaurant: string
  priceEnterprise: string
}

export default function SubscriptionPage() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [sub, setSub] = useState<Subscription | null>(null)
  const [config, setConfig] = useState<StripeConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      loadSubscription(),
      fetch(`${STORE_URL}/api/stripe-config`).then((r) => r.json()),
    ])
      .then(([subscription, stripeConfig]) => {
        setSub(subscription)
        setConfig(stripeConfig)
      })
      .catch((err) => {
        console.error(err)
        setError("Failed to load subscription data")
      })
      .finally(() => setLoading(false))
  }, [])

  const PLANS = [
    {
      id: "free",
      nameKey: "planFree",
      price: 0,
      features: ["featureSingleRestaurant", "featureBasic"],
      popular: false,
    },
    {
      id: "restaurant",
      nameKey: "planRestaurant",
      price: 2999,
      priceDisplay: "29.99",
      features: ["featureAll", "featureUnlimitedClients", "featureReservations", "featureCsvExport"],
      popular: true,
      priceId: config?.priceRestaurant || "",
    },
    {
      id: "enterprise",
      nameKey: "planEnterprise",
      price: 9999,
      priceDisplay: "99.99",
      features: ["featureMultipleRestaurants", "featureAll", "featureAllUsers", "featurePrioritySupport"],
      popular: false,
      priceId: config?.priceEnterprise || "",
    },
  ]

  const handleUpgrade = async (planId: string) => {
    const plan = PLANS.find((p) => p.id === planId)
    if (!plan?.priceId || !user?.email) {
      setError("Stripe not configured")
      return
    }

    setCheckoutLoading(planId)
    setError("")
    try {
      const res = await fetch(`${STORE_URL}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: user.id,
          email: user.email,
          returnUrl: window.location.href,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(t("paymentFailed"))
      }
    } catch (err) {
      console.error(err)
      setError(t("paymentFailed"))
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handleManageBilling = async () => {
    if (!user) return
    try {
      const res = await fetch(`${STORE_URL}/api/create-portal-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, returnUrl: window.location.href }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error(err)
    }
  }

  const trialDaysLeft = sub?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const isTrialing = sub?.status === "trialing" && sub?.plan === "free"
  const isTrialExpired = isTrialing && trialDaysLeft === 0
  const currentPlanLabel = sub?.plan === "enterprise" ? t("planEnterprise") : sub?.plan === "restaurant" ? t("planRestaurant") : t("planFree")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("subscription")}</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>{error}</span>
        </div>
      )}

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("currentPlan")}: <span className="text-primary font-bold">{currentPlanLabel}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTrialing && !isTrialExpired && (
            <p className="text-sm text-muted">
              {t("daysLeft").replace("{days}", String(trialDaysLeft))}
            </p>
          )}
          {isTrialExpired && (
            <p className="text-sm text-destructive">{t("trialExpired")}</p>
          )}
          {sub?.stripeCustomerId && (
            <Button variant="outline" size="sm" onClick={handleManageBilling} className="mt-2">
              {t("manageBilling")}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = sub?.plan === plan.id
          const showUpgrade = !isCurrent && plan.id !== "free" && plan.priceId

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular ? "border-primary ring-1 ring-primary" : ""
              } ${isCurrent ? "opacity-80" : ""}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-xs font-bold px-4 py-1 rounded-full uppercase">
                  Popular
                </span>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{t(plan.nameKey)}</CardTitle>
                <p className="text-3xl font-bold mt-2">
                  {plan.price === 0
                    ? t("planFree")
                    : t("pricePerMonth").replace("{price}", plan.priceDisplay!)}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{t(feat)}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button disabled variant="outline" className="w-full">
                    {t("current")}
                  </Button>
                ) : showUpgrade ? (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={checkoutLoading !== null}
                    className="w-full"
                  >
                    {checkoutLoading === plan.id && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {t("subscribeNow")}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
