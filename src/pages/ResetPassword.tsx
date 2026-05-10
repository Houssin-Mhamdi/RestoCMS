import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useI18n } from "../lib/i18n"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { UtensilsCrossed, KeyRound, CheckCircle } from "lucide-react"

export default function ResetPassword() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true)
      }
    })

    const hash = window.location.hash
    if (hash && hash.includes("type=recovery")) {
      setReady(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError(t("passwordMinLength"))
      return
    }
    if (password !== confirm) {
      setError(t("passwordMismatch"))
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => navigate("/login"), 2500)
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center">
            <p className="text-muted text-sm">{t("verifyingLink")}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-success mx-auto" />
            <CardTitle className="text-text">{t("passwordUpdated")}</CardTitle>
            <p className="text-sm text-muted">{t("resetPasswordRedirect")}</p>
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
          <CardTitle className="text-xl text-text">{t("resetPassword")}</CardTitle>
          <p className="text-sm text-muted">{t("forgotPasswordDesc")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">{t("newPassword")}</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <KeyRound className="h-4 w-4" />
              {loading ? t("updateLoading") : t("resetPassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
