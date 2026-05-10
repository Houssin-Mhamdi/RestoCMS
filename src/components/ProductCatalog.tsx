import { useState, useMemo } from "react"
import { useStore } from "../lib/store"
import { useI18n } from "../lib/i18n"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Search, Plus, X, ImageIcon } from "lucide-react"

const DEFAULT_MENU: { name: string; price: number; imageUrl?: string }[] = [
  { name: "Burger", price: 500 },
  { name: "Pizza", price: 800 },
  { name: "Tacos", price: 600 },
  { name: "Sandwich", price: 400 },
  { name: "Frites", price: 300 },
  { name: "Salade", price: 350 },
  { name: "Coca", price: 100 },
  { name: "Fanta", price: 100 },
  { name: "Sprite", price: 100 },
  { name: "Eau minérale", price: 80 },
  { name: "Jus d'orange", price: 200 },
  { name: "Café", price: 150 },
  { name: "Thé", price: 120 },
  { name: "Limonade", price: 180 },
  { name: "Merguez", price: 400 },
  { name: "Brochette", price: 700 },
  { name: "Poisson", price: 900 },
  { name: "Poulet rôti", price: 600 },
]

interface ProductEntry {
  name: string
  price?: number
  imageUrl?: string
}

interface ProductCatalogProps {
  selected: string[]
  onAdd: (product: { name: string; price?: number }) => void
  onRemove: (name: string) => void
}

export default function ProductCatalog({
  selected,
  onAdd,
  onRemove,
}: ProductCatalogProps) {
  const { state } = useStore()
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [custom, setCustom] = useState("")

  const allProducts: ProductEntry[] = useMemo(() => {
    const storeProducts: ProductEntry[] = state.products.map((p) => ({
      name: p.name,
      price: p.price,
      imageUrl: p.imageUrl,
    }))
    const existing = new Set(storeProducts.map((p) => p.name.toLowerCase()))
    const defaults = DEFAULT_MENU.filter(
      (d) => !existing.has(d.name.toLowerCase())
    )
    return [...storeProducts, ...defaults]
  }, [state.products])

  const filtered = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) &&
      !selected.includes(p.name)
  )

  const addCustom = () => {
    const val = custom.trim()
    if (val && !selected.includes(val)) {
      onAdd({ name: val })
      setCustom("")
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
        <Input
          placeholder={t("productCatalog")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => (
            <Badge key={item} variant="default" className="gap-1 text-xs">
              {item}
              <button onClick={() => onRemove(item)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {filtered.map((product) => (
          <Button
            key={product.name}
            variant="outline"
            size="sm"
            onClick={() => onAdd({ name: product.name, price: product.price })}
            className="h-9 text-xs gap-1.5"
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-5 w-5 rounded object-cover"
              />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-muted" />
            )}
            <span>{product.name}</span>
            {product.price != null && (
              <span className="text-primary font-semibold">
                {product.price.toLocaleString()} DA
              </span>
            )}
          </Button>
        ))}
      </div>

      <div className="flex gap-1">
        <Input
          placeholder={t("custom")}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addCustom()
          }}
          className="h-8 text-xs"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="h-8 shrink-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
