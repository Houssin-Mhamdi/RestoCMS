import { useI18n, type Lang } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import { useTheme } from "../lib/theme"
import { supabase } from "../lib/supabase"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Settings, CheckCircle, Save, Moon, Sun, Camera, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { generateId } from "../lib/utils"

export default function SettingsPage() {
  const { activeRestaurant, updateRestaurant } = useSettings()
  const { t, setLang } = useI18n()
  const { toggle: toggleTheme } = useTheme()
  const [name, setName] = useState(activeRestaurant.name)
  const [currency, setCurrency] = useState(activeRestaurant.currency)
  const [color, setColor] = useState(activeRestaurant.color)
  const [logo, setLogo] = useState(activeRestaurant.logo)
  const [tables, setTables] = useState(String(activeRestaurant.tableCount))
  const [defaultLang, setDefaultLang] = useState<Lang>(
    (localStorage.getItem("lang") as Lang) || "fr"
  )
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${generateId()}_${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(fileName)
      setLogo(publicUrl)
    } catch (err) {
      console.error("Logo upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = () => {
    updateRestaurant(activeRestaurant.id, {
      name: name.trim() || "RestoCMS",
      currency: currency.trim() || "€",
      color: color.trim() || "#f97316",
      logo: logo.trim(),
      tableCount: Math.max(0, parseInt(tables) || 0),
      darkMode: activeRestaurant.darkMode,
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
          <CardTitle className="text-lg text-text">{activeRestaurant.name}</CardTitle>
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
            <label className="text-sm font-medium text-text">{t("restaurantColor")}</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-9 rounded border border-border cursor-pointer"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#f97316" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("restaurantLogo")}</label>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {logo ? "Change logo" : "Upload logo"}
              </Button>
              {logo && (
                <button onClick={() => setLogo("")} className="text-xs text-danger hover:underline">Remove</button>
              )}
            </div>
            {logo && (
              <img src={logo} alt="logo" className="h-12 w-12 object-contain rounded border border-border mt-1" />
            )}
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
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium text-text">{t("darkMode")}</p>
              <p className="text-xs text-muted">{activeRestaurant.darkMode ? t("darkMode") : t("lightMode")}</p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-alt text-muted hover:text-text transition-colors"
            >
              {activeRestaurant.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
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
