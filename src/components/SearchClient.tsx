import { useState, useMemo } from "react"
import { useStore, type Client } from "../lib/store"
import { useI18n } from "../lib/i18n"
import { fuzzySort } from "../lib/fuzzy"
import {
  updateClientOnSupabase,
  deleteClientOnSupabase,
} from "../lib/supabase-service"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import Pagination from "./ui/pagination"
import ConfirmDialog from "./ConfirmDialog"
import EditClientModal, { type EditClientForm } from "./EditClientModal"
import {
  Search,
  Phone,
  MapPin,
  Calendar,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react"

const CLIENTS_PER_PAGE = 6

interface SearchClientProps {
  onSelectClient: (client: Client) => void
}

export default function SearchClient({ onSelectClient }: SearchClientProps) {
  const { state, dispatch } = useStore()
  const { t } = useI18n()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const [editClient, setEditClient] = useState<Client | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return state.clients
    return fuzzySort(state.clients, search, (c) =>
      `${c.phone} ${c.name} ${c.lastname} ${c.location}`
    )
  }, [state.clients, search])

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / CLIENTS_PER_PAGE)
  )
  const safePage = Math.min(page, totalPages)
  const paginatedClients = filtered.slice(
    (safePage - 1) * CLIENTS_PER_PAGE,
    safePage * CLIENTS_PER_PAGE
  )

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleEditSave = async (data: EditClientForm) => {
    if (!editClient) return
    await updateClientOnSupabase({ id: editClient.id, ...data })
    dispatch({ type: "UPDATE_CLIENT", payload: { id: editClient.id, ...data } })
    setEditClient(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteClientOnSupabase(deleteTarget.id)
    dispatch({ type: "DELETE_CLIENT", payload: deleteTarget.id })
    setDeleteTarget(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">
          {t("search")}
        </h1>
        <p className="text-sm text-muted">
          {state.clients.length} client
          {state.clients.length !== 1 ? "s" : ""} enregistr&eacute;
          {state.clients.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-muted mb-2" />
              <p className="text-sm text-muted">
                {state.clients.length === 0
                  ? t("noClients")
                  : t("noResults")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {paginatedClients.map((client) => (
              <Card
                key={client.id}
                className="transition-colors hover:border-primary/50"
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div
                    className="flex-1 space-y-2 cursor-pointer"
                    onClick={() => onSelectClient(client)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-800">
                        {client.name} {client.lastname}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {client.orders.length} commande
                        {client.orders.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {client.phone}
                      </span>
                      {client.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {client.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{" "}
                        {new Date(client.createdAt).toLocaleDateString(
                          "fr-FR"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditClient(client)}
                      className="h-8 w-8 text-muted hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(client)}
                      className="h-8 w-8 text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <ChevronRight
                      className="h-5 w-5 text-muted cursor-pointer"
                      onClick={() => onSelectClient(client)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <EditClientModal
        open={!!editClient}
        client={editClient}
        onSave={handleEditSave}
        onClose={() => setEditClient(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("deleteClient")}
        message={`${t("deleteConfirm")} ${deleteTarget?.name} ${deleteTarget?.lastname} ?`}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
