import { useI18n, type Lang } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Settings, CheckCircle, Save } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings()
  const { t, setLang } = useI18n()
  const [name, setName] = useState(settings.restaurantName)
  const [currency, setCurrency] = useState(settings.currency)
  const [tables, setTables] = useState(String(settings.tableCount))
  const [defaultLang, setDefaultLang] = useState<Lang>(
    (localStorage.getItem("lang") as Lang) || "fr"
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({
      restaurantName: name.trim() || "RestoCMS",
      currency: currency.trim() || "DA",
      tableCount: Math.max(0, parseInt(tables) || 0),
    })
    setLang(defaultLang)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          {t("settings")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">{t("settings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("restaurantName")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="RestoCMS" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("currency")}</label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="€" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("tableCount")}</label>
            <Input
              type="number"
              min="0"
              value={tables}
              onChange={(e) => setTables(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("language")}</label>
            <select
              value={defaultLang}
              onChange={(e) => setDefaultLang(e.target.value as Lang)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
          {saved && (
            <p className="text-sm text-success flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {t("settingsSaved")}
            </p>
          )}
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-1.5" />
            {t("save")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
