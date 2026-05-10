import { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useI18n } from "../lib/i18n"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { UtensilsCrossed, Send, ArrowLeft } from "lucide-react"

export default function ForgotPassword() {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="py-8 text-center space-y-4">
            <Send className="h-12 w-12 text-success mx-auto" />
            <CardTitle className="text-text">{t("emailSent")}</CardTitle>
            <p className="text-sm text-muted">
              {t("emailSentDesc")} <strong>{email}</strong>.
            </p>
            <Link
              to="/login"
              className="text-sm text-primary font-medium hover:underline"
            >
              {t("backToLogin")}
            </Link>
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
          <CardTitle className="text-xl text-text">{t("forgotPassword")}</CardTitle>
          <p className="text-sm text-muted">{t("forgotPasswordDesc")}</p>
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
            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              <Send className="h-4 w-4" />
              {loading ? t("forgotPasswordLoading") : t("forgotPasswordButton")}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              {t("backToLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
