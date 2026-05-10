import { useState } from "react"
import { useStore, type Product } from "../lib/store"
import { generateId } from "../lib/utils"
import { useI18n } from "../lib/i18n"
import {
  createProductOnSupabase,
  updateProductOnSupabase,
  deleteProductOnSupabase,
} from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import ConfirmDialog from "../components/ConfirmDialog"
import { Package, Plus, Trash2, ImageIcon, Pencil, X } from "lucide-react"

export default function ManageProducts() {
  const { state, dispatch } = useStore()
  const { t } = useI18n()

  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const resetForm = () => {
    setName("")
    setPrice("")
    setImageUrl("")
  }

  const handleAdd = async () => {
    const trimmedName = name.trim()
    const parsedPrice = Number.parseFloat(price)
    if (!trimmedName || isNaN(parsedPrice) || parsedPrice <= 0) return

    const id = generateId()

    setSaving(true)
    try {
      await createProductOnSupabase({
        id,
        name: trimmedName,
        price: parsedPrice,
        imageUrl: imageUrl.trim(),
      })
      dispatch({
        type: "ADD_PRODUCT",
        payload: {
          id,
          name: trimmedName,
          price: parsedPrice,
          imageUrl: imageUrl.trim(),
          createdAt: new Date().toISOString(),
        },
      })
      resetForm()
    } catch (err) {
      console.error("Failed to save product:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleEditSave = async () => {
    if (!editProduct) return
    const trimmedName = editProduct.name.trim()
    if (!trimmedName || editProduct.price <= 0) return

    setSaving(true)
    try {
      await updateProductOnSupabase({
        id: editProduct.id,
        name: trimmedName,
        price: editProduct.price,
        imageUrl: editProduct.imageUrl,
      })
      dispatch({ type: "UPDATE_PRODUCT", payload: editProduct })
      setEditProduct(null)
    } catch (err) {
      console.error("Failed to update product:", err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteProductOnSupabase(deleteId)
      dispatch({ type: "DELETE_PRODUCT", payload: deleteId })
    } catch (err) {
      console.error("Failed to delete product:", err)
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">{t("products")}</h1>
        <p className="text-sm text-muted">{t("addProduct")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-stone-800 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t("addProduct")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600">{t("productName")}</label>
              <Input
                placeholder="Ex: Burger"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600">{t("productPrice")}</label>
              <Input
                type="number"
                min={0}
                placeholder="500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-stone-600">{t("productImage")}</label>
              <Input
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!name.trim() || !price || Number.parseFloat(price) <= 0 || saving}
          >
            <Plus className="h-4 w-4" />
            {saving ? "..." : t("addProduct")}
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-2">
        <h2 className="text-sm font-semibold text-stone-700">
          {state.products.length} {t("products")}
        </h2>

        {state.products.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">{t("noProducts")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {state.products.map((product) => (
              <div
                key={product.id}
                className="rounded-lg border border-border bg-card p-3 space-y-2"
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none"
                      ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
                    }}
                  />
                ) : null}
                <div className={`flex items-center justify-center h-12 ${product.imageUrl ? "hidden" : ""}`}>
                  <ImageIcon className="h-8 w-8 text-muted" />
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-primary font-semibold">
                    {product.price.toLocaleString()} DA
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditProduct(product)}
                    className="flex-1 text-primary hover:bg-primary/10"
                  >
                    <Pencil className="h-3 w-3" />
                    {t("edit")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(product.id)}
                    className="flex-1 text-danger hover:bg-red-50 dark:hover:bg-red-950"
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

      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-stone-800">{t("edit")}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setEditProduct(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">{t("productName")}</label>
                <Input
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">{t("productPrice")}</label>
                <Input
                  type="number"
                  min={0}
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-stone-600">{t("productImage")}</label>
                <Input
                  value={editProduct.imageUrl}
                  onChange={(e) => setEditProduct({ ...editProduct, imageUrl: e.target.value })}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditProduct(null)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleEditSave} disabled={saving}>
                {saving ? "..." : t("save")}
              </Button>
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
