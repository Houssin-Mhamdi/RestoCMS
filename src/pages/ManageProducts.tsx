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
import { Package, Plus, Trash2, ImageIcon, Pencil, X, ChevronDown, ChevronUp, ChevronRight, Camera, Loader2 } from "lucide-react"

export default function ManageProducts() {
  const { state, dispatch } = useStore()
  const { t } = useI18n()
  const { activeRestaurant } = useSettings()

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [category, setCategory] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
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
      setImageUrl(url)
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editProduct) return
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setEditProduct({ ...editProduct, imageUrl: url })
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
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

  const resetForm = () => {
    setName(""); setPrice(""); setImageUrl(""); setCategory("")
  }

  const handleAdd = async () => {
    const trimmedName = name.trim()
    const parsedPrice = Number.parseFloat(price)
    if (!trimmedName || isNaN(parsedPrice) || parsedPrice <= 0) return
    const id = generateId()
    const nextOrder = state.products.length
    setSaving(true)
    try {
      await createProductOnSupabase({ id, name: trimmedName, price: parsedPrice, imageUrl: imageUrl.trim(), category, sortOrder: nextOrder }, activeRestaurant.id)
      dispatch({ type: "ADD_PRODUCT", payload: { id, name: trimmedName, price: parsedPrice, imageUrl: imageUrl.trim(), category, sortOrder: nextOrder, createdAt: new Date().toISOString() } })
      resetForm()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleEditSave = async () => {
    if (!editProduct) return
    const trimmedName = editProduct.name.trim()
    if (!trimmedName || editProduct.price <= 0) return
    setSaving(true)
    try {
      await updateProductOnSupabase({ id: editProduct.id, name: trimmedName, price: editProduct.price, imageUrl: editProduct.imageUrl, category: editProduct.category, sortOrder: editProduct.sortOrder })
      dispatch({ type: "UPDATE_PRODUCT", payload: editProduct })
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
    const a = sorted[idx]
    const b = sorted[swapIdx]
    const temp = a.sortOrder
    a.sortOrder = b.sortOrder
    b.sortOrder = temp
    dispatch({ type: "UPDATE_PRODUCT", payload: a })
    dispatch({ type: "UPDATE_PRODUCT", payload: b })
    try {
      await updateProductOnSupabase({ id: a.id, name: a.name, price: a.price, imageUrl: a.imageUrl, category: a.category, sortOrder: a.sortOrder })
      await updateProductOnSupabase({ id: b.id, name: b.name, price: b.price, imageUrl: b.imageUrl, category: b.category, sortOrder: b.sortOrder })
    } catch (err) { console.error(err) }
  }

  function renderProductCard(product: Product) {
    return (
      <div key={product.id} className="rounded-lg border border-border bg-card p-3 space-y-2">
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
            <p className="text-sm font-medium text-stone-800 truncate mt-1">{product.name}</p>
            <p className="text-xs text-primary font-semibold">{product.price.toLocaleString()} {activeRestaurant.currency}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditProduct(product)} className="flex-1 text-primary hover:bg-primary/10"><Pencil className="h-3 w-3" /> {t("edit")}</Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(product.id)} className="flex-1 text-danger hover:bg-red-50 dark:hover:bg-red-950"><Trash2 className="h-3 w-3" /> {t("delete")}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">{t("products")}</h1>
        <p className="text-sm text-muted">{t("addProduct")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg text-stone-800 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {t("addProduct")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600">{t("productName")}</label>
              <Input placeholder="Ex: Burger" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600">{t("productPrice")}</label>
              <Input type="number" min={0} placeholder="500" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600">{t("productImage")}</label>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {imageUrl ? "Change image" : "Upload image"}
                </Button>
                {imageUrl && (
                  <div className="relative">
                    <img src={imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                    <button onClick={() => setImageUrl("")} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-xs">×</button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600">{t("category")}</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">—</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || !price || Number.parseFloat(price) <= 0 || saving}><Plus className="h-4 w-4" /> {saving ? "..." : t("addProduct")}</Button>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        <h2 className="text-sm font-semibold text-stone-700">{state.products.length} {t("products")}</h2>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-stone-800">{t("edit")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditProduct(null)}><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">{t("productName")}</label>
                <Input value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">{t("productPrice")}</label>
                <Input type="number" min={0} value={editProduct.price} onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">{t("productImage")}</label>
                <div className="flex items-center gap-2">
                  <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={handleEditFileSelect} />
                  <Button type="button" variant="outline" size="sm" onClick={() => editFileRef.current?.click()} disabled={uploading} className="gap-1.5">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    {editProduct.imageUrl ? "Change image" : "Upload image"}
                  </Button>
                  {editProduct.imageUrl && (
                    <div className="relative">
                      <img src={editProduct.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                      <button onClick={() => setEditProduct({ ...editProduct, imageUrl: "" })} className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-xs">×</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">{t("category")}</label>
                <select value={editProduct.category} onChange={(e) => setEditProduct({ ...editProduct, category: e.target.value })} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">—</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
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
