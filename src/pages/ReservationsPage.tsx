import { useState } from "react"
import { useStore, type Reservation } from "../lib/store"
import { useSettings } from "../lib/settings"
import { useI18n } from "../lib/i18n"
import {
  updateReservationOnSupabase,
  updateTableOnSupabase,
} from "../lib/supabase-service"
import { Button } from "../components/ui/button"
import { CalendarCheck, Eye, X, Check, Phone, Mail, Clock, Users, MapPin, Store } from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-950/20 text-amber-500 border-amber-500/30",
  accepted: "bg-green-950/20 text-green-400 border-green-400/30",
  rejected: "bg-red-950/20 text-red-400 border-red-400/30",
}

export default function ReservationsPage() {
  const { state, dispatch } = useStore()
  const { activeRestaurant } = useSettings()
  const { t } = useI18n()
  const [viewing, setViewing] = useState<Reservation | null>(null)

  const handleAccept = async (reservation: Reservation) => {
    try {
      const updated = { ...reservation, status: "accepted" as const }
      await updateReservationOnSupabase(updated)
      dispatch({ type: "UPDATE_RESERVATION", payload: updated })

      const table = state.tables.find((tbl) => tbl.id === reservation.tableId)
      if (table) {
        const updatedTable = { ...table, status: "occupied" as const, customerName: reservation.guestName }
        await updateTableOnSupabase(updatedTable)
        dispatch({ type: "UPDATE_TABLE", payload: updatedTable })
      }

      fetch("http://localhost:3000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: reservation.email,
          guestName: reservation.guestName,
          tableNumber: reservation.tableNumber,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
        }),
      }).catch(() => {})

      setViewing(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleReject = async (reservation: Reservation) => {
    try {
      const updated = { ...reservation, status: "rejected" as const }
      await updateReservationOnSupabase(updated)
      dispatch({ type: "UPDATE_RESERVATION", payload: updated })

      const table = state.tables.find((tbl) => tbl.id === reservation.tableId)
      if (table && table.status === "reserved") {
        const updatedTable = { ...table, status: "free" as const, customerName: "" }
        await updateTableOnSupabase(updatedTable)
        dispatch({ type: "UPDATE_TABLE", payload: updatedTable })
      }

      setViewing(null)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-primary" />
          {t("reservations")}
        </h1>
      </div>

      {state.reservations.length === 0 ? (
        <p className="text-sm text-muted text-center py-12">{t("noReservations")}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-text">{t("guestName")}</th>
                <th className="text-left px-4 py-3 font-semibold text-text">{t("tables")}</th>
                <th className="text-left px-4 py-3 font-semibold text-text">{t("date")}</th>
                <th className="text-left px-4 py-3 font-semibold text-text">{t("capacity")}</th>
                <th className="text-left px-4 py-3 font-semibold text-text">{t("restaurantName")}</th>
                <th className="text-left px-4 py-3 font-semibold text-text">{t("status")}</th>
                <th className="text-right px-4 py-3 font-semibold text-text">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {state.reservations.map((res) => (
                <tr key={res.id} className="hover:bg-surface-alt/50 transition-colors">
                  <td className="px-4 py-3 text-text font-medium">{res.guestName}</td>
                  <td className="px-4 py-3 text-text">#{res.tableNumber}</td>
                  <td className="px-4 py-3 text-text">{res.date} {res.time && `- ${res.time}`}</td>
                  <td className="px-4 py-3 text-text">{res.guests}</td>
                  <td className="px-4 py-3 text-text">{res.restaurantName || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${STATUS_STYLES[res.status] || ""}`}>
                      {t(res.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewing(res)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                {t("reservations")}
              </h2>
              <button onClick={() => setViewing(null)} className="text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-sm">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-text font-medium">{viewing.guestName}</p>
                  <p className="text-muted text-xs">{t("guestName")}</p>
                </div>

                <Phone className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-text">{viewing.phone || "—"}</p>
                  <p className="text-muted text-xs">{t("phone")}</p>
                </div>

                <Mail className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-text">{viewing.email || "—"}</p>
                  <p className="text-muted text-xs">{t("email")}</p>
                </div>

                <TableIcon className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-text">#{viewing.tableNumber}</p>
                  <p className="text-muted text-xs">{t("tables")}</p>
                </div>

                <Clock className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-text">{viewing.date} {viewing.time && `at ${viewing.time}`}</p>
                  <p className="text-muted text-xs">{t("date")}</p>
                </div>

                <Users className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-text">{viewing.guests}</p>
                  <p className="text-muted text-xs">{t("capacity")}</p>
                </div>

                <Store className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-text">{viewing.restaurantName || "—"}</p>
                  <p className="text-muted text-xs">{t("restaurantName")}</p>
                </div>

                <span className="h-4 w-4 text-primary mt-0.5 flex items-center justify-center">•</span>
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${STATUS_STYLES[viewing.status] || ""}`}>
                    {t(viewing.status)}
                  </span>
                </div>
              </div>

              {viewing.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(viewing)}
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-950/20"
                  >
                    <X className="h-4 w-4" />
                    {t("reject")}
                  </Button>
                  <Button
                    onClick={() => handleAccept(viewing)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4" />
                    {t("accept")}
                  </Button>
                </div>
              )}

              {viewing.status !== "pending" && (
                <div className="pt-2">
                  <Button variant="outline" onClick={() => setViewing(null)} className="w-full">
                    {t("cancel")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  )
}
