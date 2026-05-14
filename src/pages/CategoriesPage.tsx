import { useState } from "react"
import { useStore } from "../lib/store"
import { useSettings } from "../lib/settings"
import { createCategoryOnSupabase, deleteCategoryOnSupabase } from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import ConfirmDialog from "../components/ConfirmDialog"
import { useI18n } from "../lib/i18n"
import { Tag, Plus, Trash2 } from "lucide-react"

export default function CategoriesPage() {
  const { state, dispatch } = useStore()
  const { activeRestaurant } = useSettings()
  const { t } = useI18n()
  const [input, setInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleAdd = async () => {
    const name = input.trim()
    if (!name) return
    setSaving(true)
    try {
      const id = await createCategoryOnSupabase(name, activeRestaurant.id)
      dispatch({ type: "ADD_CATEGORY", payload: { id, name } })
      setInput("")
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteCategoryOnSupabase(deleteId)
      dispatch({ type: "DELETE_CATEGORY", payload: deleteId })
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          {t("categories")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">{t("addCategory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={t("addCategory")}
            />
            <Button onClick={handleAdd} disabled={!input.trim() || saving}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-2">
        {state.categories.length === 0 && (
          <p className="text-sm text-muted text-center py-8">{t("noCategories")}</p>
        )}
        {state.categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <Tag className="h-4 w-4 text-primary shrink-0" />
            <span className="flex-1 text-sm text-text">{cat.name}</span>
            <button
              onClick={() => setDeleteId(cat.id)}
              className="text-muted hover:text-danger transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title={t("delete")}
        message={`${t("deleteConfirm")} "${state.categories.find((c) => c.id === deleteId)?.name}" ?`}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
