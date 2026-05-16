import { useState, useRef } from "react"
import { useStore, type Product } from "../lib/store"
import { supabase } from "../lib/supabase"
import { generateId } from "../lib/utils"
import { useI18n } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import {
  createProductOnSupabase,
  updateProductOnSupabase,
  deleteProductOnSupabase,
} from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import ConfirmDialog from "../components/ConfirmDialog"
import {
  Package, Plus, Trash2, ImageIcon, Pencil, X, ChevronDown, ChevronUp,
  ChevronRight, Camera, Loader2, EyeOff, Star, UtensilsCrossed,
  Archive, DollarSign, AlertTriangle,
} from "lucide-react"

type Tab = "basic" | "storefront" | "inventory"

const emptyForm = () => ({
  name: "", price: 0, imageUrl: "", category: "", sortOrder: 0,
  description: "", tag: "", isSignature: false, available: true, featured: false,
  prepTime: 0, stock: -1, unit: "", costPrice: 0, minStock: 0, allergens: "", dietary: "",
})

export default function ManageProducts() {
  const { state, dispatch } = useStore()
  const { t } = useI18n()
  const { activeRestaurant } = useSettings()

  const [form, setForm] = useState(emptyForm())
  const [tab, setTab] = useState<Tab>("basic")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editTab, setEditTab] = useState<Tab>("basic")
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop()
    const fileName = `${generateId()}_${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file)
    if (uploadError) throw uploadError
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName)
    return publicUrl
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm({ ...form, imageUrl: url })
    } catch (err) { console.error("Upload failed:", err) }
    finally { setUploading(false) }
  }

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editProduct) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setEditProduct({ ...editProduct, imageUrl: url })
    } catch (err) { console.error("Upload failed:", err) }
    finally { setUploading(false) }
  }

  const categories = state.categories.map((c) => c.name).sort()

  const productsByCategory = new Map<string, Product[]>()
  const uncategorized: Product[] = []
  for (const p of [...state.products].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (p.category) {
      const list = productsByCategory.get(p.category) || []
      list.push(p)
      productsByCategory.set(p.category, list)
    } else {
      uncategorized.push(p)
    }
  }

  const resetForm = () => { setForm(emptyForm()); setTab("basic") }

  const handleAdd = async () => {
    const trimmedName = form.name.trim()
    if (!trimmedName || form.price <= 0) return
    const id = generateId()
    const nextOrder = state.products.length
    setSaving(true)
    try {
      await createProductOnSupabase({ ...form, id, name: trimmedName, sortOrder: nextOrder }, activeRestaurant.id)
      dispatch({ type: "ADD_PRODUCT", payload: { ...form, id, name: trimmedName, sortOrder: nextOrder, createdAt: new Date().toISOString() } })
      resetForm()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleEditSave = async () => {
    if (!editProduct) return
    const trimmedName = editProduct.name.trim()
    if (!trimmedName || editProduct.price <= 0) return
    setSaving(true)
    try {
      await updateProductOnSupabase({ ...editProduct, name: trimmedName })
      dispatch({ type: "UPDATE_PRODUCT", payload: { ...editProduct, name: trimmedName } })
      setEditProduct(null)
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProductOnSupabase(deleteId)
      dispatch({ type: "DELETE_PRODUCT", payload: deleteId })
    } catch (err) { console.error(err) } finally { setDeleteId(null) }
  }

  const moveProduct = async (productId: string, direction: "up" | "down") => {
    const sorted = [...state.products].sort((a, b) => a.sortOrder - b.sortOrder)
    const idx = sorted.findIndex((p) => p.id === productId)
    if (idx === -1) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]; const b = sorted[swapIdx]
    const temp = a.sortOrder; a.sortOrder = b.sortOrder; b.sortOrder = temp
    dispatch({ type: "UPDATE_PRODUCT", payload: a })
    dispatch({ type: "UPDATE_PRODUCT", payload: b })
    try {
      await updateProductOnSupabase(a)
      await updateProductOnSupabase(b)
    } catch (err) { console.error(err) }
  }

  function Tabs({ active, onChange, prefix }: { active: Tab; onChange: (t: Tab) => void; prefix?: string }) {
    const tabs: { key: Tab; label: string }[] = [
      { key: "basic", label: t("general") },
      { key: "storefront", label: t("store") },
      { key: "inventory", label: t("stock") || "Stock" },
    ]
    return (
      <div className="flex gap-1 border-b border-border mb-4">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => onChange(tb.key)}
            className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              active === tb.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>
    )
  }

  function BasicFields({ data, onChange }: { data: any; onChange: (d: any) => void }) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted">{t("productName")}</label>
          <Input placeholder="Ex: Truffle Risotto, Wagyu Steak, Saffron Pasta" value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted">{t("productPrice")} (€)</label>
          <Input type="number" min={0} step="0.50" placeholder="Ex: 24.50, 45, 89" value={data.price || ""} onChange={(e) => onChange({ ...data, price: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-muted">{t("productImage")}</label>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {data.imageUrl ? "Change" : "Upload"}
            </Button>
            {data.imageUrl && (
              <div className="relative">
                <img src={data.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                <button onClick={() => onChange({ ...data, imageUrl: "" })} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px]">×</button>
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">{t("category")}</label>
          <select value={data.category} onChange={(e) => onChange({ ...data, category: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">—</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">{t("tag")}</label>
          <Input placeholder="Ex: Artisanal, Rare Ingredients, Exclusive, Fresh" value={data.tag} onChange={(e) => onChange({ ...data, tag: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted">{t("description")}</label>
          <textarea value={data.description} onChange={(e) => onChange({ ...data, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" placeholder="Ex: Aged for 60 days, served with truffle butter and seasonal vegetables." />
        </div>
      </div>
    )
  }

  function StorefrontFields({ data, onChange }: { data: any; onChange: (d: any) => void }) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={data.isSignature} onChange={(e) => onChange({ ...data, isSignature: e.target.checked })} className="rounded border-border" />
            <UtensilsCrossed className="h-4 w-4 text-primary" />
            {t("isSignature")}
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={data.featured} onChange={(e) => onChange({ ...data, featured: e.target.checked })} className="rounded border-border" />
            <Star className="h-4 w-4 text-amber-500" />
            {t("featured")}
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={data.available} onChange={(e) => onChange({ ...data, available: e.target.checked })} className="rounded border-border" />
            {data.available ? <Package className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted" />}
            {t("available")}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted">{t("prepTime")} (min)</label>
            <Input type="number" min={0} value={data.prepTime} onChange={(e) => onChange({ ...data, prepTime: parseInt(e.target.value) || 0 })} placeholder="Ex: 15, 30, 45" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">{t("dietary")}</label>
            <Input placeholder="Ex: Vegan, Gluten-Free, Vegetarian, Keto" value={data.dietary} onChange={(e) => onChange({ ...data, dietary: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted">{t("allergens")}</label>
            <Input placeholder="Ex: Nuts, Dairy, Soy, Shellfish, Eggs" value={data.allergens} onChange={(e) => onChange({ ...data, allergens: e.target.value })} />
          </div>
        </div>
      </div>
    )
  }

  function InventoryFields({ data, onChange }: { data: any; onChange: (d: any) => void }) {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted flex items-center gap-1">
            <Archive className="h-3 w-3" /> {t("stock")}
          </label>
          <Input type="number" min={-1} value={data.stock} onChange={(e) => onChange({ ...data, stock: parseInt(e.target.value) || -1 })} placeholder="Ex: 50, 10, ou -1 (illimité)" />
          <p className="text-[10px] text-muted mt-0.5">-1 = illimité</p>
        </div>
        <div>
          <label className="text-xs font-medium text-muted">{t("unit")}</label>
          <Input placeholder="Ex: kg, pièce, litre, portion" value={data.unit} onChange={(e) => onChange({ ...data, unit: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> {t("costPrice")} (€)
          </label>
          <Input type="number" min={0} step="0.01" value={data.costPrice || ""} onChange={(e) => onChange({ ...data, costPrice: parseFloat(e.target.value) || 0 })} placeholder="Ex: 8.50, 12.00" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> {t("minStock")}
          </label>
          <Input type="number" min={0} value={data.minStock} onChange={(e) => onChange({ ...data, minStock: parseInt(e.target.value) || 0 })} placeholder="Ex: 5, 10" />
        </div>
      </div>
    )
  }

  function renderProductCard(product: Product) {
    const lowStock = product.stock >= 0 && product.stock <= product.minStock
    return (
      <div key={product.id} className={`rounded-lg border p-3 space-y-2 ${!product.available ? 'border-red-400/30 opacity-60' : 'border-border bg-card'}`}>
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-0.5 pt-0.5">
            <button onClick={() => moveProduct(product.id, "up")} className="text-muted hover:text-text p-0.5"><ChevronUp className="h-3 w-3" /></button>
            <button onClick={() => moveProduct(product.id, "down")} className="text-muted hover:text-text p-0.5"><ChevronDown className="h-3 w-3" /></button>
          </div>
          <div className="flex-1 min-w-0">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-20 object-cover rounded-md" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
            ) : (
              <div className="flex items-center justify-center h-12"><ImageIcon className="h-8 w-8 text-muted" /></div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <p className="text-sm font-medium text-stone-800 truncate">{product.name}</p>
              {product.isSignature && <UtensilsCrossed className="h-3 w-3 text-primary shrink-0" />}
              {!product.available && <EyeOff className="h-3 w-3 text-muted shrink-0" />}
              {product.featured && <Star className="h-3 w-3 text-amber-500 shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-primary font-semibold">{product.price.toLocaleString()} {activeRestaurant.currency}</span>
              {product.stock >= 0 && (
                <span className={`${lowStock ? 'text-red-500' : 'text-muted'}`}>
                  {product.stock} {product.unit}
                </span>
              )}
            </div>
            {product.tag && (
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-primary/30 text-primary bg-primary/10">
                {product.tag}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setEditProduct(product); setEditTab("basic") }} className="flex-1 text-primary hover:bg-primary/10"><Pencil className="h-3 w-3" /> {t("edit")}</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(product.id)} className="flex-1 text-danger hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="h-3 w-3" /> {t("delete")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          {t("menu")}
        </h1>
        <p className="text-sm text-muted">{state.products.length} {t("products")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg text-text flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> {t("addProduct")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs active={tab} onChange={setTab} />
          {tab === "basic" && <BasicFields data={form} onChange={setForm} />}
          {tab === "storefront" && <StorefrontFields data={form} onChange={setForm} />}
          {tab === "inventory" && <InventoryFields data={form} onChange={setForm} />}
          <Button onClick={handleAdd} disabled={!form.name.trim() || form.price <= 0 || saving}><Plus className="h-4 w-4" /> {saving ? "..." : t("addProduct")}</Button>
        </CardContent>
      </Card>

      {(() => {
        const lowStockItems = state.products.filter((p) => p.stock >= 0 && p.stock <= p.minStock && p.available)
        if (lowStockItems.length === 0) return null
        return (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-950/10 p-4">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm mb-2">
              <AlertTriangle className="h-5 w-5" />
              {lowStockItems.length === 1
                ? `1 produit est presque en rupture de stock`
                : `${lowStockItems.length} produits sont presque en rupture de stock`}
            </div>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1 rounded-md bg-red-950/20 px-2.5 py-1 text-xs text-red-400 border border-red-500/20">
                  {p.name}
                  <span className="font-bold">{p.stock}{p.unit ? ` ${p.unit}` : ""}</span>
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="mt-6 space-y-4">
        {state.products.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">{t("noProducts")}</p>
        ) : (
          <>
            {uncategorized.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("general")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{uncategorized.map(renderProductCard)}</div>
              </div>
            )}
            {[...productsByCategory.entries()].map(([cat, prods]) => (
              <div key={cat}>
                <button onClick={() => setCollapsed((s) => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n })} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-2 hover:text-text transition-colors">
                  {collapsed.has(cat) ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {cat} ({prods.length})
                </button>
                {!collapsed.has(cat) && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">{prods.map(renderProductCard)}</div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditProduct(null)}>
          <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-text">{t("edit")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditProduct(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <Tabs active={editTab} onChange={setEditTab} />
              {editTab === "basic" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-muted">{t("productName")}</label>
                    <Input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">{t("productPrice")}</label>
                    <Input type="number" min={0} value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted">{t("productImage")}</label>
                    <div className="flex items-center gap-2">
                      <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditFileSelect} />
                      <Button type="button" variant="outline" size="sm" onClick={() => editFileRef.current?.click()} disabled={uploading} className="gap-1.5">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        {editProduct.imageUrl ? "Change" : "Upload"}
                      </Button>
                      {editProduct.imageUrl && (
                        <div className="relative">
                          <img src={editProduct.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                          <button onClick={() => setEditProduct({ ...editProduct, imageUrl: "" })} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px]">×</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">{t("category")}</label>
                    <select value={editProduct.category} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">—</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">{t("tag")}</label>
                    <Input value={editProduct.tag} onChange={(e) => setEditProduct({ ...editProduct, tag: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted">{t("description")}</label>
                    <textarea value={editProduct.description} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} rows={3} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                  </div>
                </div>
              )}
              {editTab === "storefront" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm text-text">
                      <input type="checkbox" checked={editProduct.isSignature} onChange={(e) => setEditProduct({ ...editProduct, isSignature: e.target.checked })} className="rounded border-border" />
                      <UtensilsCrossed className="h-4 w-4 text-primary" /> {t("isSignature")}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text">
                      <input type="checkbox" checked={editProduct.featured} onChange={(e) => setEditProduct({ ...editProduct, featured: e.target.checked })} className="rounded border-border" />
                      <Star className="h-4 w-4 text-amber-500" /> {t("featured")}
                    </label>
                    <label className="flex items-center gap-2 text-sm text-text">
                      <input type="checkbox" checked={editProduct.available} onChange={(e) => setEditProduct({ ...editProduct, available: e.target.checked })} className="rounded border-border" />
                      {t("available")}
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted">{t("prepTime")}</label>
                      <Input type="number" min={0} value={editProduct.prepTime} onChange={(e) => setEditProduct({ ...editProduct, prepTime: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted">{t("dietary")}</label>
                      <Input value={editProduct.dietary} onChange={(e) => setEditProduct({ ...editProduct, dietary: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-muted">{t("allergens")}</label>
                      <Input value={editProduct.allergens} onChange={(e) => setEditProduct({ ...editProduct, allergens: e.target.value })} />
                    </div>
                  </div>
                </div>
              )}
              {editTab === "inventory" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted">{t("stock")}</label>
                    <Input type="number" min={-1} value={editProduct.stock} onChange={(e) => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || -1 })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">{t("unit")}</label>
                    <Input value={editProduct.unit} onChange={(e) => setEditProduct({ ...editProduct, unit: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">{t("costPrice")}</label>
                    <Input type="number" min={0} step="0.01" value={editProduct.costPrice} onChange={(e) => setEditProduct({ ...editProduct, costPrice: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">{t("minStock")}</label>
                    <Input type="number" min={0} value={editProduct.minStock} onChange={(e) => setEditProduct({ ...editProduct, minStock: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditProduct(null)}>{t("cancel")}</Button>
              <Button onClick={handleEditSave} disabled={saving}>{saving ? "..." : t("save")}</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t("deleteProduct")}
        message={`${t("deleteConfirm")} ce produit ?`}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
