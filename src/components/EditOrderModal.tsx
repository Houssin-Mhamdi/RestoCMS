import { useState, useEffect } from "react"
import type { Order, OrderItem, Product } from "../lib/store"
import { useI18n } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import AutocompleteInput from "./AutocompleteInput"
import { X, Plus, Trash2, ShoppingCart } from "lucide-react"

interface EditOrderModalProps {
  open: boolean
  order: Order | null
  cloneItems?: OrderItem[] | null
  productNames: string[]
  products: Product[]
  onSave: (items: OrderItem[]) => Promise<void>
  onClose: () => void
}

let idCounter = 0
function createEditItem(name = "", price = 0): OrderItem {
  return { id: `edit_${++idCounter}`, name, quantity: 1, price }
}

export default function EditOrderModal({
  open,
  order,
  cloneItems,
  productNames,
  onSave,
  onClose,
  products,
}: EditOrderModalProps) {
  const { t } = useI18n()
  const { activeRestaurant } = useSettings()
  const [items, setItems] = useState<OrderItem[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (order) {
      setItems(order.items.map((i) => ({ ...i })))
    } else if (cloneItems) {
      setItems(cloneItems.map((i) => ({ ...i })))
    }
  }, [order, cloneItems])

  if (!open || (!order && !cloneItems)) return null

  const isClone = !order && !!cloneItems

  const addItem = () => setItems((prev) => [...prev, createEditItem()])
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))
  const updateItem = (id: string, field: keyof OrderItem, value: string | number) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const updated = { ...i, [field]: value }
        if (field === "name" && typeof value === "string") {
          const product = products.find((p) => p.name.toLowerCase() === value.toLowerCase())
          if (product) updated.price = product.price
        }
        return updated
      })
    )

  const handleSave = async () => {
    const valid = items.filter((i) => i.name.trim())
    if (valid.length === 0) return
    setSaving(true)
    try {
      await onSave(valid)
      onClose()
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const total = items.reduce((s, i) => s + i.price * Math.max(1, i.quantity), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg text-stone-800">
              {isClone ? "Clone" : t("editOrder")}
            </CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-end gap-2 rounded-lg border border-border p-3 bg-surface-alt"
            >
              <div className="flex-1 space-y-1 min-w-0">
                <label className="text-xs font-medium text-stone-600">{t("article")}</label>
                <AutocompleteInput
                  value={item.name}
                  onChange={(v) => updateItem(item.id, "name", v)}
                  suggestions={productNames}
                  placeholder="Ex: Burger"
                  className="h-8 text-xs"
                />
              </div>
              <div className="w-16 space-y-1 shrink-0">
                <label className="text-xs font-medium text-stone-600">{t("qty")}</label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="w-20 space-y-1 shrink-0">
                <label className="text-xs font-medium text-stone-600">{t("price")}</label>
                <Input
                  type="number"
                  min={0}
                  value={item.price}
                  onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="h-8 w-8 text-danger shrink-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem} className="w-full border-dashed">
            <Plus className="h-3 w-3" />
            {t("addArticle")}
          </Button>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-stone-600">{t("total")}</span>
            <span className="text-lg font-bold text-primary">{total.toLocaleString()} {activeRestaurant.currency}</span>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t("cancel")}</Button>
          <Button onClick={handleSave} disabled={saving || items.filter((i) => i.name.trim()).length === 0}>
            {saving ? "..." : isClone ? t("create") : t("save")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
