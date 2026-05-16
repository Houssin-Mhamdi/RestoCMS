import { useState, useMemo } from "react"
import { useStore, type TableStatus, type RestaurantTable } from "../lib/store"
import { useSettings } from "../lib/settings"
import { useI18n } from "../lib/i18n"
import { createTableOnSupabase, updateTableOnSupabase, deleteTableOnSupabase } from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import ConfirmDialog from "../components/ConfirmDialog"
import { Table, Plus, Trash2, Users, Settings2, X, User } from "lucide-react"

const STATUS_COLORS: Record<TableStatus, string> = {
  free: "border-green-400 bg-green-50 dark:bg-green-950/20",
  occupied: "border-red-400 bg-red-50 dark:bg-red-950/20",
  reserved: "border-amber-400 bg-amber-50 dark:bg-amber-950/20",
}

const STATUS_LABELS: Record<TableStatus, string> = {
  free: "free",
  occupied: "occupied",
  reserved: "reserved",
}

export default function TablesPage() {
  const { state, dispatch } = useStore()
  const { activeRestaurant } = useSettings()
  const { t } = useI18n()
  const [num, setNum] = useState("")
  const [cap, setCap] = useState("4")
  const [genCount, setGenCount] = useState("10")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null)
  const [editName, setEditName] = useState("")
  const [editStatus, setEditStatus] = useState<TableStatus>("free")
  const [filter, setFilter] = useState<"all" | TableStatus>("all")

  const filteredTables = useMemo(() => {
    const sorted = [...state.tables].sort((a, b) => a.number - b.number)
    return filter === "all" ? sorted : sorted.filter((t) => t.status === filter)
  }, [state.tables, filter])

  const handleAdd = async () => {
    const n = parseInt(num)
    if (isNaN(n) || n <= 0) return
    const c = Math.max(1, parseInt(cap) || 4)
    setSaving(true)
    try {
      const id = await createTableOnSupabase({ number: n, capacity: c, status: "free", customerName: "" }, activeRestaurant.id)
      dispatch({ type: "ADD_TABLE", payload: { id, number: n, capacity: c, status: "free", customerName: "" } })
      setNum("")
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteTableOnSupabase(deleteId)
      dispatch({ type: "DELETE_TABLE", payload: deleteId })
    } catch (err) {
      console.error(err)
    } finally {
      setDeleteId(null)
    }
  }

  const handleGenerate = async () => {
    const maxTables = activeRestaurant.tableCount || 50
    const count = Math.min(maxTables, Math.max(1, parseInt(genCount) || 10))
    const existing = state.tables.map((t) => t.number)
    const toCreate: { number: number; capacity: number; status: TableStatus; customerName: string }[] = []
    for (let i = 1; i <= count; i++) {
      if (!existing.includes(i)) {
        toCreate.push({ number: i, capacity: 4, status: "free", customerName: "" })
      }
    }
    if (toCreate.length === 0) return
    setSaving(true)
    try {
      for (const t of toCreate) {
        const id = await createTableOnSupabase(t, activeRestaurant.id)
        dispatch({ type: "ADD_TABLE", payload: { ...t, id } })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const openTableDialog = (table: RestaurantTable) => {
    setEditName(table.customerName)
    setEditStatus(table.status)
    setEditingTable(table)
  }

  const handleSaveTable = async () => {
    if (!editingTable) return
    const updated = { ...editingTable, customerName: editName, status: editStatus }
    try {
      await updateTableOnSupabase(updated)
      dispatch({ type: "UPDATE_TABLE", payload: updated })
      setEditingTable(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Table className="h-6 w-6 text-primary" />
          {t("tables")}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text">{t("addTable")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="w-28">
              <label className="text-xs font-medium text-muted">{t("tableNumber")}</label>
              <Input type="number" min={1} value={num} onChange={(e) => setNum(e.target.value)} placeholder="1" />
            </div>
            <div className="w-28">
              <label className="text-xs font-medium text-muted">{t("capacity")}</label>
              <Input type="number" min={1} value={cap} onChange={(e) => setCap(e.target.value)} placeholder="4" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={!num || saving}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <label className="text-xs font-medium text-muted">{t("generateTables")}</label>
            <Input
              type="number"
              min={1}
              max={activeRestaurant.tableCount || 50}
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              className="w-20"
            />
            <span className="text-xs text-muted">/ {activeRestaurant.tableCount || 50}</span>
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={saving}>
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm text-muted">{filteredTables.length}/{state.tables.length} {t("tables")}</p>
          <div className="ml-auto flex gap-1">
            {(["all", "free", "occupied", "reserved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider border-2 transition-all ${
                  filter === s
                    ? s === "all" ? "border-primary bg-primary/10 text-primary"
                      : s === "free" ? "border-green-400 bg-green-50 dark:bg-green-950/20 text-green-600"
                      : s === "occupied" ? "border-red-400 bg-red-50 dark:bg-red-950/20 text-red-600"
                      : "border-amber-400 bg-amber-50 dark:bg-amber-950/20 text-amber-600"
                    : "border-transparent text-muted hover:bg-surface-alt"
                }`}
              >
                {s === "all" ? t("all") : t(STATUS_LABELS[s])}
              </button>
            ))}
          </div>
        </div>
        {filteredTables.length === 0 ? (
          <p className="text-sm text-muted text-center py-12">{t("noData")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                role="button"
                tabIndex={0}
                onClick={() => openTableDialog(table)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openTableDialog(table) }}
                className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-4 transition-all hover:shadow-md cursor-pointer ${STATUS_COLORS[table.status]}`}
              >
                <span className="text-lg font-bold text-text">{table.number}</span>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Users className="h-3 w-3" />
                  {table.capacity}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                  table.status === "free" ? "text-green-600" :
                  table.status === "occupied" ? "text-red-600" :
                  "text-amber-600"
                }`}>
                  {t(STATUS_LABELS[table.status])}
                </span>
                {table.customerName && (
                  <span className="text-xs text-text truncate max-w-full">{table.customerName}</span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(table.id) }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                {table.status !== "free" && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      const updated = { ...table, status: "free" as const, customerName: "" }
                      try {
                        await updateTableOnSupabase(updated)
                        dispatch({ type: "UPDATE_TABLE", payload: updated })
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                    className="absolute top-0 left-0 w-6 h-6 flex items-center justify-center bg-green-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity rounded-br-lg"
                    title={t("free")}
                  >
                    ✓
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {editingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setEditingTable(null)}>
          <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h2 className="text-lg font-semibold text-text">
                {t("tables")} {editingTable.number}
              </h2>
              <button onClick={() => setEditingTable(null)} className="text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted">{t("name")}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Ex: Marc"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted">{t("status")}</label>
                <div className="flex gap-2">
                    {(["free", "occupied", "reserved"] as TableStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { setEditStatus(s); if (s === "free") setEditName("") }}
                      className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                        editStatus === s
                          ? STATUS_COLORS[s] + " ring-2 ring-primary"
                          : "border-border text-muted"
                      }`}
                    >
                      {t(STATUS_LABELS[s])}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setEditingTable(null)} className="flex-1">
                  {t("cancel")}
                </Button>
                <Button onClick={handleSaveTable} className="flex-1">
                  {t("save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t("delete")}
        message={`${t("deleteConfirm")} ${t("tableNumber")} ${state.tables.find((t) => t.id === deleteId)?.number} ?`}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
