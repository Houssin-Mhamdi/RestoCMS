import { useState, useEffect } from "react"
import { useI18n } from "../lib/i18n"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { X, User } from "lucide-react"

interface EditClientForm {
  name: string
  lastname: string
  phone: string
  location: string
}

interface EditClientModalProps {
  open: boolean
  client: { id: string; name: string; lastname: string; phone: string; location: string } | null
  onSave: (data: EditClientForm) => Promise<void>
  onClose: () => void
}

export default function EditClientModal({
  open,
  client,
  onSave,
  onClose,
}: EditClientModalProps) {
  const { t } = useI18n()
  const [form, setForm] = useState<EditClientForm>({
    name: "",
    lastname: "",
    phone: "",
    location: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name,
        lastname: client.lastname,
        phone: client.phone,
        location: client.location,
      })
    }
  }, [client])

  if (!open || !client) return null

  const handleSave = async () => {
    if (!form.name.trim() || !form.lastname.trim() || !form.phone.trim()) {
      setError("Veuillez remplir tous les champs obligatoires")
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch {
      setError("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-stone-800">
              {t("editClient")}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">
                {t("name")}
              </label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "") })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">
                {t("lastname")}
              </label>
              <Input
                value={form.lastname}
                onChange={(e) =>
                  setForm({ ...form, lastname: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "") })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">
                {t("phone")}
              </label>
              <Input
                value={form.phone}
                onChange={(e) =>
                  setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-700">
                {t("address")}
              </label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "..." : t("save")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export type { EditClientForm }
