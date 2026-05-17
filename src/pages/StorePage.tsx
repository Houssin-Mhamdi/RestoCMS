import { useState, useRef } from "react"
import { useSettings } from "../lib/settings"
import { useI18n } from "../lib/i18n"
import { supabase } from "../lib/supabase"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Store, Camera, Loader2, ExternalLink, Save } from "lucide-react"
import { generateId } from "../lib/utils"

export default function StorePage() {
  const { activeRestaurant, updateRestaurant } = useSettings()
  const { t } = useI18n()
  const [name, setName] = useState(activeRestaurant.name)
  const [logo, setLogo] = useState(activeRestaurant.logo)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
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
      ...activeRestaurant,
      name: name.trim() || activeRestaurant.name,
      logo: logo.trim(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handlePreview = () => {
    window.open(`https://restooline.netlify.app/${activeRestaurant.slug}`, "_blank")
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          {t("store")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">{t("storeSettings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("restaurantName")}</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text">{t("restaurantLogo")}</label>
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {logo ? t("edit") : t("upload")}
              </Button>
              {logo && (
                <button onClick={() => setLogo("")} className="text-xs text-danger hover:underline">{t("remove")}</button>
              )}
            </div>
            {logo && (
              <img src={logo} alt="logo" className="h-12 w-12 object-contain rounded border border-border mt-1" />
            )}
          </div>

          {saved && (
            <p className="text-sm text-success">{t("settingsSaved")}</p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="h-4 w-4 mr-1.5" />
              {t("save")}
            </Button>
            <Button variant="outline" onClick={handlePreview} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-1.5" />
              {t("preview")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
