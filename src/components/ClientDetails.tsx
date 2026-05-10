import { useState, useMemo } from "react"
import { useStore, type Client, type OrderItem as OrderItemType } from "../lib/store"
import { generateId } from "../lib/utils"
import { useI18n, LOCALE_MAP } from "../lib/i18n"
import {
  createOrderOnSupabase,
  updateOrderOnSupabase,
  deleteOrderOnSupabase,
} from "../lib/supabase-service"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Separator } from "./ui/separator"
import { ScrollArea } from "./ui/scroll-area"
import AutocompleteInput from "./AutocompleteInput"
import { useSettings } from "../lib/settings"
import EditOrderModal from "./EditOrderModal"
import ConfirmDialog from "./ConfirmDialog"
import {
  X,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  User,
  Plus,
  Trash2,
  ClipboardPlus,
  Pencil,
  Copy,
} from "lucide-react"

interface OrderItemInput {
  id: string
  name: string
  quantity: number
  price: number
}

let itemIdCounter = 0
function createItem(): OrderItemInput {
  return { id: `det_item_${++itemIdCounter}`, name: "", quantity: 1, price: 0 }
}

interface ClientDetailsProps {
  client: Client
  onClose: () => void
}

export default function ClientDetails({ client, onClose }: ClientDetailsProps) {
  const { state, dispatch } = useStore()
  const { t, lang } = useI18n()
  const { activeRestaurant } = useSettings()
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [items, setItems] = useState<OrderItemInput[]>([])
  const [saving, setSaving] = useState(false)
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null)
  const [editOrder, setEditOrder] = useState<OrderItemType[] | null>(null)
  const [editOrderId, setEditOrderId] = useState<string | null>(null)

  const productNames = useMemo(() => {
    // count how many times this client ordered each product (favorites)
    const freq = new Map<string, number>()
    for (const order of client.orders) {
      for (const item of order.items) {
        freq.set(item.name, (freq.get(item.name) || 0) + item.quantity)
      }
    }
    const names = new Set(state.products.map((p) => p.name))
    state.clients.forEach((c) =>
      c.orders.forEach((o) => o.items.forEach((i) => names.add(i.name)))
    )
    return Array.from(names).sort((a, b) => {
      const fa = freq.get(a) || 0
      const fb = freq.get(b) || 0
      if (fa !== fb) return fb - fa
      return a.localeCompare(b)
    })
  }, [state.products, state.clients, client.orders])

  const addItem = () => setItems((prev) => [...prev, createItem()])
  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id))
  const updateItem = (
    id: string,
    field: keyof OrderItemInput,
    value: string | number
  ) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    )

  const handleAddOrder = async () => {
    const validItems = items.filter((i) => i.name.trim())
    if (validItems.length === 0) return

    const orderId = generateId()
    const total = validItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const order = {
      id: orderId,
      clientId: client.id,
      items: validItems.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      total,
      date: new Date().toISOString(),
    }

    setSaving(true)
    try {
      await createOrderOnSupabase(order, activeRestaurant.id)
      dispatch({
        type: "ADD_ORDER",
        payload: { clientId: client.id, items: order.items },
      })
      setItems([])
      setShowAddOrder(false)
    } catch (err) {
      console.error("Failed to save order:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleEditOrderSave = async (updatedItems: OrderItemType[]) => {
    if (!editOrderId) return
    const total = updatedItems.reduce((s, i) => s + i.price * i.quantity, 0)
    if (editOrderId === "__clone__") {
      const orderId = generateId()
      await createOrderOnSupabase({
        id: orderId,
        clientId: client.id,
        items: updatedItems,
        total,
        date: new Date().toISOString(),
      }, activeRestaurant.id)
      dispatch({
        type: "ADD_ORDER",
        payload: { clientId: client.id, items: updatedItems },
      })
    } else {
      await updateOrderOnSupabase({ id: editOrderId, items: updatedItems, total })
      dispatch({
        type: "UPDATE_ORDER",
        payload: { clientId: client.id, orderId: editOrderId, items: updatedItems, total },
      })
    }
    setEditOrderId(null)
  }

  const handleCloneOrder = async (orderItems: OrderItemType[]) => {
    const orderId = generateId()
    const items = orderItems.map((i) => ({ ...i, id: generateId() }))
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const order = {
      id: orderId,
      clientId: client.id,
      items,
      total,
      date: new Date().toISOString(),
    }

    setSaving(true)
    try {
      await createOrderOnSupabase(order, activeRestaurant.id)
      dispatch({
        type: "ADD_ORDER",
        payload: { clientId: client.id, items: order.items },
      })
    } catch (err) {
      console.error("Failed to clone order:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return
    try {
      await deleteOrderOnSupabase(deleteOrderId)
      dispatch({
        type: "DELETE_ORDER",
        payload: { clientId: client.id, orderId: deleteOrderId },
      })
    } catch (err) {
      console.error("Failed to delete order:", err)
    } finally {
      setDeleteOrderId(null)
    }
  }

  const newOrderTotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      <aside
        className={`fixed right-0 top-0 z-40 h-full w-96 max-w-full bg-card shadow-2xl transition-transform duration-300 border-l border-border ${
          state.rightSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 min-w-0">
            <User className="h-5 w-5 text-primary shrink-0" />
            <span className="font-semibold text-stone-800 truncate">
              {client.name} {client.lastname}
            </span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="p-4 space-y-4">
            <div className="rounded-lg bg-surface-alt p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Coordonn&eacute;es
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-stone-700">
                  <Phone className="h-4 w-4 text-muted shrink-0" />
                  <span className="truncate">{client.phone}</span>
                </div>
                {client.location && (
                  <div className="flex items-center gap-2 text-stone-700">
                    <MapPin className="h-4 w-4 text-muted shrink-0" />
                    <span className="truncate">{client.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-stone-700">
                  <Calendar className="h-4 w-4 text-muted shrink-0" />
                  <span>
                    {t("clientSince")}{" "}
                    {new Date(client.createdAt).toLocaleDateString(LOCALE_MAP[lang])}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  <ShoppingCart className="h-4 w-4" />
                  {t("orderHistory")}
                  <Badge variant="secondary">{client.orders.length}</Badge>
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddOrder(!showAddOrder)}
                >
                  <ClipboardPlus className="h-3 w-3" />
                  {showAddOrder ? t("cancel") : t("newOrder")}
                </Button>
              </div>

              {showAddOrder && (
                <div className="rounded-lg border border-primary/30 bg-primary-light p-3 mb-4 space-y-2">
                  <p className="text-xs font-semibold text-stone-700">
                    {t("newOrder")}
                  </p>

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-end gap-1 rounded border border-border bg-card p-2"
                    >
                      <div className="flex-1 space-y-1 min-w-0">
                        <label className="text-[10px] text-muted">
                          {t("article")}
                        </label>
                        <AutocompleteInput
                          value={item.name}
                          onChange={(v) => updateItem(item.id, "name", v)}
                          suggestions={productNames}
                          placeholder="Ex: Pizza"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="w-14 space-y-1 shrink-0">
                        <label className="text-[10px] text-muted">{t("qty")}</label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", Number(e.target.value))
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="w-16 space-y-1 shrink-0">
                        <label className="text-[10px] text-muted">{t("price")}</label>
                        <Input
                          type="number"
                          min={0}
                          value={item.price}
                          onChange={(e) =>
                            updateItem(item.id, "price", Number(e.target.value))
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 text-danger shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addItem}
                    className="w-full border border-dashed border-border text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    {t("addArticle")}
                  </Button>

                  {items.length > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-stone-600">{t("total")}</span>
                      <span className="text-sm font-bold text-primary">
                        {newOrderTotal.toLocaleString()} {activeRestaurant.currency}
                      </span>
                    </div>
                  )}

                  <Button
                    size="sm"
                    onClick={handleAddOrder}
                    disabled={items.filter((i) => i.name.trim()).length === 0 || saving}
                    className="w-full mt-1"
                  >
                    <Plus className="h-3 w-3" />
                    {saving ? "..." : t("addOrder")}
                  </Button>
                </div>
              )}

              {client.orders.length === 0 ? (
                <p className="text-sm text-muted text-center py-6">
                  {t("noOrders")}
                </p>
              ) : (
                <div className="space-y-3">
                  {[...client.orders]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() -
                        new Date(a.date).getTime()
                    )
                    .map((order) => (
                      <div
                        key={order.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted">
                            {new Date(order.date).toLocaleDateString(LOCALE_MAP[lang], {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <div className="flex items-center gap-1">
                            <Badge variant="success">
                              {order.total.toLocaleString()} {activeRestaurant.currency}
                            </Badge>
                          </div>
                        </div>
                        <ul className="space-y-1">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between text-sm text-stone-600"
                            >
                              <span>
                                {item.name}{" "}
                                <span className="text-muted">
                                  x{item.quantity}
                                </span>
                              </span>
                              <span>
                                {(item.price * item.quantity).toLocaleString()}{" "}
                                {activeRestaurant.currency}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-1 mt-2 pt-2 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditOrderId(order.id)
                              setEditOrder(order.items)
                            }}
                            className="flex-1 h-7 text-xs text-primary"
                          >
                            <Pencil className="h-3 w-3" />
                            {t("edit")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const clonedItems = order.items.map((i) => ({ ...i, id: generateId() }))
                              setEditOrder(clonedItems)
                              setEditOrderId("__clone__")
                            }}
                            className="flex-1 h-7 text-xs text-accent"
                          >
                            <Copy className="h-3 w-3" />
                            {t("newOrder")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteOrderId(order.id)}
                            className="flex-1 h-7 text-xs text-danger"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t("delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </aside>

      <EditOrderModal
        open={!!editOrderId}
        order={editOrderId && editOrderId !== "__clone__" ? client.orders.find((o) => o.id === editOrderId) || null : null}
        cloneItems={editOrderId === "__clone__" ? editOrder : null}
        productNames={productNames}
        onSave={handleEditOrderSave}
        onClose={() => { setEditOrderId(null); setEditOrder(null) }}
      />

      <ConfirmDialog
        open={!!deleteOrderId}
        title={t("deleteOrder")}
        message={`${t("deleteConfirm")} cette commande ?`}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDeleteOrder}
        onCancel={() => setDeleteOrderId(null)}
      />
    </>
  )
}
