import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../lib/auth"
import { useI18n } from "../lib/i18n"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { UtensilsCrossed, UserPlus } from "lucide-react"

export default function Signup() {
  const { signUp } = useAuth()
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t("passwordMismatch"))
      return
    }
    if (password.length < 6) {
      setError(t("passwordMinLength"))
      return
    }
    setLoading(true)
    const err = await signUp(email, password, restaurantName || undefined)
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <UtensilsCrossed className="h-12 w-12 text-success mx-auto" />
            <CardTitle className="text-text">{t("signupSuccess")}</CardTitle>
            <p className="text-sm text-muted">
              {t("signupSuccessDesc")}{" "}
              <Link
                to="/login"
                className="text-primary font-medium hover:underline"
              >
                {t("loginButton")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <UtensilsCrossed className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl text-text">{t("signup")}</CardTitle>
          <p className="text-sm text-muted">{t("signupDesc")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">{t("email")}</label>
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">{t("password")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">{t("restaurantName")}</label>
              <Input
                type="text"
                placeholder="My Restaurant"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">{t("confirmPassword")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <UserPlus className="h-4 w-4" />
              {loading ? t("signupLoading") : t("signupButton")}
            </Button>
          </form>
          <p className="text-sm text-center text-muted mt-4">
            {t("alreadyHaveAccount")}{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              {t("loginButton")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
