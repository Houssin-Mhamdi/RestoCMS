import { useEffect, useState } from "react"
import { useI18n } from "../lib/i18n"
import { generateId } from "../lib/utils"
import {
  loadCalendarEvents,
  createCalendarEventOnSupabase,
  updateCalendarEventOnSupabase,
  deleteCalendarEventOnSupabase,
  type CalendarEvent,
} from "../lib/supabase-service"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Dialog } from "../components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Plus,
  Trash2,
  Pencil,
  Save,
} from "lucide-react"

const WEEKDAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startPadding = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7
  return { startPadding, daysInMonth, totalCells }
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export default function CalendarPage() {
  const { t } = useI18n()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())

const [dialogOpen, setDialogOpen] = useState(false)
const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
const [selectedDate, setSelectedDate] = useState("")
const [formTitle, setFormTitle] = useState("")
const [formNote, setFormNote] = useState("")
const [formRemindDays, setFormRemindDays] = useState(0)

  useEffect(() => {
    setLoading(true)
    loadCalendarEvents()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const eventsByDate: Record<string, CalendarEvent[]> = {}
  for (const e of events) {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  }

  const { startPadding, daysInMonth, totalCells } = getMonthDays(year, month)
  const weeks = []
  for (let i = 0; i < totalCells; i += 7) {
    weeks.push(Array.from({ length: 7 }, (_, j) => i + j))
  }

  const today = new Date()
  const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  function openAddDialog(day: number) {
    const dateKey = formatDateKey(year, month, day)
    setSelectedDate(dateKey)
    setEditingEvent(null)
    setFormTitle("")
    setFormNote("")
    setFormRemindDays(0)
    setDialogOpen(true)
  }

  function openEditDialog(e: CalendarEvent) {
    setSelectedDate(e.date)
    setEditingEvent(e)
    setFormTitle(e.title)
    setFormNote(e.note)
    setFormRemindDays(e.remindDays)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formTitle.trim()) return
    if (editingEvent) {
      await updateCalendarEventOnSupabase({
        id: editingEvent.id,
        date: selectedDate,
        title: formTitle.trim(),
        note: formNote.trim(),
        remindDays: formRemindDays,
      })
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === editingEvent.id
            ? { ...ev, date: selectedDate, title: formTitle.trim(), note: formNote.trim(), remindDays: formRemindDays }
            : ev
        )
      )
    } else {
      const id = generateId()
      await createCalendarEventOnSupabase({
        id,
        date: selectedDate,
        title: formTitle.trim(),
        note: formNote.trim(),
        remindDays: formRemindDays,
      })
      setEvents((prev) => [
        ...prev,
        { id, date: selectedDate, title: formTitle.trim(), note: formNote.trim(), remindDays: formRemindDays, createdAt: new Date().toISOString() },
      ])
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteCalendarEventOnSupabase(id)
    setEvents((prev) => prev.filter((ev) => ev.id !== id))
    setDialogOpen(false)
  }

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  function goToday() {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted text-sm">{t("loading")}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            {t("calendar")}
          </h1>
          <p className="text-sm text-muted">{t("addEvent")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={goToday}>
          {t("today")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-surface-alt text-muted hover:text-text transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-text">
              {MONTHS[month]} {year}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-surface-alt text-muted hover:text-text transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="bg-surface-alt px-2 py-2 text-center text-xs font-semibold text-muted uppercase tracking-wider"
              >
                {d}
              </div>
            ))}

            {Array.from({ length: totalCells }).map((_, idx) => {
              const day = idx - startPadding + 1
              const isPadding = day < 1 || day > daysInMonth
              const dateKey = isPadding ? "" : formatDateKey(year, month, day)
              const dayEvents = dateKey ? eventsByDate[dateKey] || [] : []
              const isToday = dateKey === todayStr

              return (
                <div
                  key={idx}
                  onClick={() => !isPadding && openAddDialog(day)}
                  className={`min-h-[80px] sm:min-h-[100px] p-1.5 bg-card cursor-pointer transition-colors hover:bg-surface-alt ${
                    isPadding ? "opacity-30" : ""
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-primary text-white"
                        : "text-text"
                    }`}
                  >
                    {!isPadding && day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(ev)
                        }}
                        className="block w-full text-left text-xs truncate rounded px-1.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted pl-1.5">
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingEvent ? t("editEvent") : t("addEvent")}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t("eventTitle")}
            </label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t("eventTitle")}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t("eventNote")}
            </label>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder={t("eventNote")}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              {t("remindDays")}
            </label>
            <select
              value={formRemindDays}
              onChange={(e) => setFormRemindDays(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Array.from({ length: 31 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>{n === 0 ? t("sameDay") : `${n} ${t("daysAfter")}`}</option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">{t("remindDaysHint")}</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={handleSave} disabled={!formTitle.trim()}>
              <Save className="h-4 w-4 mr-1.5" />
              {t("save")}
            </Button>
            {editingEvent && (
              <Button
                variant="destructive"
                onClick={() => handleDelete(editingEvent.id)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                {t("delete")}
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              {t("cancel")}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
