import { useState, useEffect } from "react"
import { useSettings } from "../lib/settings"
import { useI18n } from "../lib/i18n"
import {
  loadAvailabilitySettings,
  saveAvailabilitySettings,
  type AvailabilitySettings,
} from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import TimePicker from "../components/ui/time-picker"
import { Clock, Save } from "lucide-react"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function AvailabilityPage() {
  const { activeRestaurant } = useSettings()
  const { t } = useI18n()
  const [settings, setSettings] = useState<AvailabilitySettings>({
    openingHours: {},
    maxGuestsPerSlot: 20,
    slotInterval: 60,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAvailabilitySettings(activeRestaurant.id)
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeRestaurant.id])

  const toggleDay = (day: string) => {
    const current = settings.openingHours[day]
    setSettings({
      ...settings,
      openingHours: {
        ...settings.openingHours,
        [day]: current ? null : { open: "09:00", close: "22:00" },
      },
    })
  }

  const updateDayHours = (day: string, field: "open" | "close", value: string) => {
    const current = settings.openingHours[day]
    if (!current) return
    setSettings({
      ...settings,
      openingHours: {
        ...settings.openingHours,
        [day]: { ...current, [field]: value },
      },
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveAvailabilitySettings(activeRestaurant.id, settings)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted text-center py-12">{t("loading")}</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          {t("availability")}
        </h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">{t("openingHours")}</h2>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const hours = settings.openingHours[day]
              return (
                <div key={day} className="flex items-center gap-3">
                  <label className="w-28 text-sm font-medium text-text shrink-0">{t(day)}</label>
                  <button
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-colors ${
                      hours
                        ? "bg-green-950/20 text-green-400 border-green-400/30"
                        : "bg-red-950/20 text-red-400 border-red-400/30"
                    }`}
                  >
                    {hours ? t("open") : t("closed")}
                  </button>
                  {hours && (
                    <div className="flex items-center gap-2">
                      <TimePicker
                        value={hours.open}
                        onChange={(v) => updateDayHours(day, "open", v)}
                      />
                      <span className="text-muted text-sm">—</span>
                      <TimePicker
                        value={hours.close}
                        onChange={(v) => updateDayHours(day, "close", v)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted">{t("maxGuestsPerSlot")}</label>
            <input
              type="number"
              min={1}
              value={settings.maxGuestsPerSlot}
              onChange={(e) => setSettings({ ...settings, maxGuestsPerSlot: parseInt(e.target.value) || 1 })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">{t("slotInterval")}</label>
            <input
              type="number"
              min={15}
              step={15}
              value={settings.slotInterval}
              onChange={(e) => setSettings({ ...settings, slotInterval: parseInt(e.target.value) || 60 })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4" />
          {saving ? t("loading") : t("save")}
        </Button>
      </div>
    </div>
  )
}
