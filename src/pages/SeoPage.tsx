import { useState, useEffect } from "react"
import { useSettings } from "../lib/settings"
import { useI18n } from "../lib/i18n"
import { useStore } from "../lib/store"
import { saveSeoSetting, type SeoSettingsInput } from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Search, Save } from "lucide-react"

const PAGES = ["home", "menu", "gallery", "reservations"]

export default function SeoPage() {
  const { activeRestaurant } = useSettings()
  const { t } = useI18n()
  const { state, dispatch } = useStore()
  const [saving, setSaving] = useState<string | null>(null)

  const handleSave = async (page: string, input: SeoSettingsInput) => {
    setSaving(page)
    try {
      await saveSeoSetting(activeRestaurant.id, input)
      dispatch({ type: "UPDATE_SEO_SETTING", payload: input })
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(null)
    }
  }

  const setField = (page: string, field: keyof SeoSettingsInput, value: string) => {
    const current = state.seoSettings[page]
    dispatch({
      type: "UPDATE_SEO_SETTING",
      payload: {
        page,
        metaTitle: current?.metaTitle || "",
        metaDescription: current?.metaDescription || "",
        ogTitle: current?.ogTitle || "",
        ogDescription: current?.ogDescription || "",
        ogImage: current?.ogImage || "",
        keywords: current?.keywords || "",
        h1Heading: current?.h1Heading || "",
        [field]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Search className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{t("seoSettings")}</h1>
      </div>

      <p className="text-sm text-muted mb-4">{t("seoHint")}</p>

      <div className="grid grid-cols-1 gap-8">
        {PAGES.map((page) => {
          const seo = state.seoSettings[page] || {
            page,
            metaTitle: "",
            metaDescription: "",
            ogTitle: "",
            ogDescription: "",
            ogImage: "",
            keywords: "",
            h1Heading: "",
          }

          return (
            <Card key={page}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="capitalize">{t(page === "home" ? "home" : page)}</span>
                  <span className="text-xs text-muted font-normal uppercase tracking-wider">
                    /{page === "home" ? "" : page}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">{t("metaTitle")}</label>
                    <Input
                      value={seo.metaTitle}
                      onChange={(e) => setField(page, "metaTitle", e.target.value)}
                      placeholder="Desplain — Culinary Artistry Redefined"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">{t("metaDescription")}</label>
                    <Input
                      value={seo.metaDescription}
                      onChange={(e) => setField(page, "metaDescription", e.target.value)}
                      placeholder="Experience the pinnacle of culinary artistry..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">{t("ogTitle")}</label>
                    <Input
                      value={seo.ogTitle}
                      onChange={(e) => setField(page, "ogTitle", e.target.value)}
                      placeholder="Desplain — Culinary Artistry Redefined"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">{t("ogDescription")}</label>
                    <Input
                      value={seo.ogDescription}
                      onChange={(e) => setField(page, "ogDescription", e.target.value)}
                      placeholder="Experience the pinnacle of culinary artistry..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">{t("ogImage")}</label>
                    <Input
                      value={seo.ogImage}
                      onChange={(e) => setField(page, "ogImage", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">{t("keywords")}</label>
                    <Input
                      value={seo.keywords}
                      onChange={(e) => setField(page, "keywords", e.target.value)}
                      placeholder="fine dining, restaurant, culinary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted">{t("h1Heading")}</label>
                    <Input
                      value={seo.h1Heading}
                      onChange={(e) => setField(page, "h1Heading", e.target.value)}
                      placeholder="CULINARY ARTISTRY REDEFINED"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleSave(page, seo)}
                    disabled={saving === page}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving === page ? t("loading") : t("save")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
