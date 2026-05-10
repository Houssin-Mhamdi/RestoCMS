import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useI18n } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Building2, CheckCircle } from "lucide-react"

export default function CreateRestaurant() {
  const { t } = useI18n()
  const { addRestaurant } = useSettings()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("€")
  const [color, setColor] = useState("#f97316")
  const [logo, setLogo] = useState("")
  const [created, setCreated] = useState(false)

  const handleCreate = () => {
    const id = crypto.randomUUID()
    addRestaurant({
      id,
      name: name.trim() || "Mon Restaurant",
      currency: currency.trim() || "€",
      color: color.trim() || "#f97316",
      logo: logo.trim(),
      tableCount: 0,
      darkMode: false,
    })
    setCreated(true)
    setTimeout(() => navigate("/"), 1500)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          {t("createRestaurant")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">{t("restaurantDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("restaurantName")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mon Restaurant" />
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
            <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
            {logo && (
              <img src={logo} alt="logo" className="h-12 w-12 object-contain rounded border border-border mt-1" />
            )}
          </div>
          {created && (
            <p className="text-sm text-success flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              {t("restaurantCreated")}
            </p>
          )}
          <Button onClick={handleCreate} className="w-full" disabled={created}>
            <Building2 className="h-4 w-4 mr-1.5" />
            {t("create")}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
