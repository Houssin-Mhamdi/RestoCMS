import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../lib/auth"
import { useI18n } from "../lib/i18n"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { UtensilsCrossed, LogIn } from "lucide-react"

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <UtensilsCrossed className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl text-text">{t("login")}</CardTitle>
          <p className="text-sm text-muted">{t("loginDesc")}</p>
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
            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? t("loginLoading") : t("loginButton")}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <p>
              <Link
                to="/forgot-password"
                className="text-muted hover:text-primary hover:underline"
              >
                {t("forgotPasswordLink")}
              </Link>
            </p>
            <p className="text-muted">
              {t("noAccount")}{" "}
              <Link
                to="/signup"
                className="text-primary font-medium hover:underline"
              >
                {t("signupButton")}
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
