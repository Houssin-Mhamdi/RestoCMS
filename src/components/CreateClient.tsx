import { useState, useMemo } from "react"
import { useStore } from "../lib/store"
import { generateId } from "../lib/utils"
import { useI18n } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import { createClientOnSupabase, updateProductOnSupabase } from "../lib/supabase-service"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import AutocompleteInput from "./AutocompleteInput"
import ProductCatalog from "./ProductCatalog"
import { Plus, Trash2, ShoppingBag, UserPlus } from "lucide-react"

interface OrderItemInput {
  id: string
  name: string
  quantity: number
  price: number
  productId?: string
}

let itemIdCounter = 0
function createItem(name = "", price = 0, productId?: string): OrderItemInput {
  return { id: `item_${++itemIdCounter}`, name, quantity: 1, price, productId }
}

export default function CreateClient() {
  const { state, dispatch } = useStore()
  const { t } = useI18n()
  const { activeRestaurant } = useSettings()
  const [name, setName] = useState("")
  const [lastname, setLastname] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [items, setItems] = useState<OrderItemInput[]>([])
  const [saving, setSaving] = useState(false)

  const productNames = useMemo(() => {
    const names = new Set(state.products.map((p) => p.name))
    state.clients.forEach((c) =>
      c.orders.forEach((o) => o.items.forEach((i) => names.add(i.name)))
    )
    return Array.from(names).sort()
  }, [state.products, state.clients])

  const addItem = () => setItems((prev) => [...prev, createItem()])
  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id))
  const updateItem = (
    id: string,
    field: keyof OrderItemInput,
    value: string | number
  ) =>
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const updated = { ...i, [field]: value }
        // Auto-fill price when name matches a product
        if (field === "name" && typeof value === "string") {
          const product = state.products.find((p) => p.name.toLowerCase() === value.toLowerCase())
          if (product) {
            updated.price = product.price
            updated.productId = product.id
          }
        }
        return updated
      })
    )

  const catalogNames = items.map((i) => i.name)
  const handleCatalogAdd = (product: { name: string; price?: number; productId?: string }) => {
    setItems((prev) => [...prev, createItem(product.name, product.price ?? 0, product.productId)])
  }
  const handleCatalogRemove = (productName: string) => {
    setItems((prev) => prev.filter((i) => i.name !== productName))
  }

  const resetForm = () => {
    setName("")
    setLastname("")
    setPhone("")
    setLocation("")
    setItems([])
    itemIdCounter = 0
  }

  const handleSubmit = async () => {
    if (!name.trim() || !lastname.trim() || !phone.trim()) return

    const validItems = items.filter((i) => i.name.trim())
    const clientId = generateId()
    const orderId = validItems.length > 0 ? generateId() : undefined

    const orderItems = validItems.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      productId: i.productId,
    }))

    const newClient = {
      id: clientId,
      name: name.trim(),
      lastname: lastname.trim(),
      phone: phone.trim(),
      location: location.trim(),
      orders:
        validItems.length > 0
          ? [
              {
                id: orderId!,
                items: orderItems,
                date: new Date().toISOString(),
                total: validItems.reduce(
                  (s, i) => s + i.price * i.quantity,
                  0
                ),
              },
            ]
          : [],
    }

    setSaving(true)
    try {
      await createClientOnSupabase(newClient, activeRestaurant.id)
      dispatch({ type: "ADD_CLIENT", payload: newClient })

      // Decrement stock for each product in the order
      for (const item of orderItems) {
        if (!item.productId) continue
        const product = state.products.find((p) => p.id === item.productId)
        if (!product || product.stock < 0) continue
        const newStock = Math.max(0, product.stock - item.quantity)
        const updated = { ...product, stock: newStock }
        await updateProductOnSupabase(updated)
        dispatch({ type: "UPDATE_PRODUCT", payload: updated })
      }

      resetForm()
    } catch (err) {
      console.error("Failed to save client:", err)
    } finally {
      setSaving(false)
    }
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          {t("newClient")}
        </h1>
        <p className="text-sm text-muted">
          {t("clientInfo")} et {t("orderedItems").toLowerCase()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-stone-800 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {t("clientInfo")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">
                {t("name")}
              </label>
              <Input
                placeholder="Ex: Mohamed"
                value={name}
                onChange={(e) =>
                  setName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">
                {t("lastname")}
              </label>
              <Input
                placeholder="Ex: Benali"
                value={lastname}
                onChange={(e) =>
                  setLastname(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">
                {t("phone")}
              </label>
              <Input
                placeholder="Ex: 0555 12 34 56"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">
                {t("address")}
              </label>
              <Input
                placeholder="Ex: 5 Rue Didouche Mourad"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg text-stone-800 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            {t("orderedItems")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProductCatalog
            selected={catalogNames}
            onAdd={handleCatalogAdd}
            onRemove={handleCatalogRemove}
          />

          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-end gap-2 rounded-lg border border-border p-3 bg-surface-alt"
            >
              <div className="flex-1 space-y-2 min-w-0">
                  <label className="text-xs font-medium text-stone-600">
                    {t("article")}
                  </label>
                  <AutocompleteInput
                    value={item.name}
                    onChange={(v) => updateItem(item.id, "name", v)}
                    suggestions={productNames}
                    placeholder="Ex: Burger"
                  />
              </div>
              <div className="w-20 space-y-2 shrink-0">
                <label className="text-xs font-medium text-stone-600">
                  {t("qty")}
                </label>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.id, "quantity", Number(e.target.value))
                  }
                />
              </div>
              <div className="w-24 space-y-2 shrink-0">
                <label className="text-xs font-medium text-stone-600">
                  {t("price")} ({activeRestaurant.currency})
                </label>
                <Input
                  type="number"
                  min={0}
                  value={item.price}
                  onChange={(e) =>
                    updateItem(item.id, "price", Number(e.target.value))
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeItem(item.id)}
                className="text-danger hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={addItem}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4" />
            {t("addArticle")}
          </Button>

          {items.length > 0 && (
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-stone-600">{t("total")}</span>
              <span className="text-lg font-bold text-primary">
                {total.toLocaleString()} {activeRestaurant.currency}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={
            !name.trim() || !lastname.trim() || !phone.trim() || saving
          }
          className="px-8"
        >
          <UserPlus className="h-4 w-4" />
          {saving ? "..." : t("createClient")}
        </Button>
      </div>
    </div>
  )
}
