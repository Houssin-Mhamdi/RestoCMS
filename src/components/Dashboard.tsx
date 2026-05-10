import { useState, useMemo, useEffect, useRef } from "react"
import { useStore } from "../lib/store"
import { useI18n, LOCALE_MAP } from "../lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import Pagination from "./ui/pagination"
import ExportButton from "./ExportButton"
import { loadCalendarEvents, type CalendarEvent } from "../lib/supabase-service"
import { useNavigate } from "react-router-dom"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import {
  Users,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Calendar,
  CalendarDays,
  Bell,
} from "lucide-react"

const CHART_COLORS = ["#ea580c", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"]
const ORDERS_PER_PAGE = 5

export default function Dashboard() {
  const { state } = useStore()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const locale = LOCALE_MAP[lang]
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [topN, setTopN] = useState(10)
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [todayEventsLoading, setTodayEventsLoading] = useState(true)
  const [reminderFilter, setReminderFilter] = useState<"remind" | "5days" | "30days">("remind")
  const allEventsRef = useRef<CalendarEvent[]>([])

  useEffect(() => {
    setTodayEventsLoading(true)
    loadCalendarEvents()
      .then((events) => {
        allEventsRef.current = events
        return events
      })
      .then(filterEvents)
      .catch(console.error)
      .finally(() => setTodayEventsLoading(false))
  }, [])

  function filterEvents(events: CalendarEvent[]) {
    const today = new Date()
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    setTodayEvents(
      events.filter((e) => {
        const eventDate = new Date(e.date + "T00:00:00")
        const diffDays = Math.round((eventDate.getTime() - todayDate.getTime()) / 86400000)
        if (diffDays < 0) return false
        if (reminderFilter === "5days") return diffDays <= 5
        if (reminderFilter === "30days") return diffDays <= 30
        return diffDays <= e.remindDays
      })
    )
  }

  function handleReminderFilterChange(val: typeof reminderFilter) {
    setReminderFilter(val)
    setTodayEventsLoading(true)
    setTimeout(() => {
      filterEvents(allEventsRef.current)
      setTodayEventsLoading(false)
    }, 300)
  }

  const allOrders = useMemo(
    () =>
      state.clients
        .flatMap((c) =>
          c.orders.map((o) => ({ ...o, clientName: `${c.name} ${c.lastname}` }))
        )
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
    [state.clients]
  )

  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return allOrders
    const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null
    return allOrders.filter((o) => {
      const d = new Date(o.date)
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })
  }, [allOrders, dateFrom, dateTo])

  const stats = useMemo(() => {
    const clientIds = new Set(filteredOrders.map((o) => o.clientName))
    const totalRev = filteredOrders.reduce((s, o) => s + o.total, 0)
    return [
      {
        key: "clients",
        value: clientIds.size,
        icon: Users,
        color: "text-primary",
        bg: "bg-primary-light",
      },
      {
        key: "orders",
        value: filteredOrders.length,
        icon: ShoppingCart,
        color: "text-blue-600",
        bg: "bg-blue-50",
      },
      {
        key: "revenue",
        value: `${totalRev.toLocaleString()} DA`,
        icon: DollarSign,
        color: "text-success",
        bg: "bg-green-50",
      },
      {
        key: "avgPerOrder",
        value: filteredOrders.length
          ? `${(totalRev / filteredOrders.length).toFixed(0)} DA`
          : "0 DA",
        icon: TrendingUp,
        color: "text-accent",
        bg: "bg-amber-50",
      },
    ]
  }, [filteredOrders])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  )
  const safePage = Math.min(page, totalPages)
  const paginatedOrders = filteredOrders.slice(
    (safePage - 1) * ORDERS_PER_PAGE,
    safePage * ORDERS_PER_PAGE
  )

  // Daily revenue — last topN days when no date filter
  const revenueData = useMemo(() => {
    const days: { date: string; revenu: number }[] = []
    const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null
    const end = to || new Date()
    const start = from || new Date(end.getTime() - (topN - 1) * 86400000)
    if (filteredOrders.length === 0) return days
    const cur = new Date(start)
    while (cur <= end) {
      days.push({
        date: cur.toLocaleDateString(locale, {
          day: "2-digit",
          month: "2-digit",
        }),
        revenu: 0,
      })
      cur.setDate(cur.getDate() + 1)
    }
    for (const order of filteredOrders) {
      const key = new Date(order.date).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
      })
      const entry = days.find((e) => e.date === key)
      if (entry) entry.revenu += order.total
    }
    return days
  }, [filteredOrders, dateFrom, dateTo, topN])

  // Top N clients by total spend
  const topClients = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of filteredOrders) {
      map.set(order.clientName, (map.get(order.clientName) || 0) + order.total)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([name, total]) => ({
        name: name.length > 12 ? name.substring(0, 12) + "…" : name,
        total,
      }))
  }, [filteredOrders, topN])

  // Top N selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of filteredOrders) {
      for (const item of order.items) {
        map.set(item.name, (map.get(item.name) || 0) + item.quantity)
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([name, qty]) => ({
        name: name.length > 12 ? name.substring(0, 12) + "…" : name,
        quantity: qty,
      }))
  }, [filteredOrders, topN])

  const exportData = useMemo(
    () =>
      filteredOrders.map((o) => ({
        clientName: o.clientName,
        date: o.date,
        total: o.total,
        items: o.items.map((i) => `${i.name} x${i.quantity}`).join(", "),
      })),
    [filteredOrders]
  )

  const hasData = filteredOrders.length > 0

  const handleDateFrom = (val: string) => {
    setDateFrom(val)
    setPage(1)
  }
  const handleDateTo = (val: string) => {
    setDateTo(val)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            {t("dashboard")}
          </h1>
          <p className="text-muted text-sm">{t("dashboardSubtitle")}</p>
        </div>
        {hasData && <ExportButton data={exportData} />}
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted" />
            <span className="text-sm text-stone-600">{t("from")}</span>
          </div>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => handleDateFrom(e.target.value)}
            className="w-40"
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-600">{t("to")}</span>
          </div>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => handleDateTo(e.target.value)}
            className="w-40"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => {
                setDateFrom("")
                setDateTo("")
                setPage(1)
              }}
              className="text-sm text-primary hover:underline"
            >
              {t("reset")}
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-stone-600">{t("show")}</span>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="h-9 rounded-md border border-border bg-card px-2 text-sm text-stone-700 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.key}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted">{t(stat.key)}</p>
                  <p className="text-2xl font-bold text-stone-800">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {(todayEventsLoading || todayEvents.length > 0) && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-stone-800 dark:text-text">{t("todayReminder")}</span>
              </CardTitle>
              <div className="flex items-center gap-2">
                <select
                  value={reminderFilter}
                  onChange={(e) => handleReminderFilterChange(e.target.value as typeof reminderFilter)}
                  className="h-7 rounded-md border border-border bg-card px-2 text-xs text-text shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="remind">{t("remindFilter")}</option>
                  <option value="5days">5 {t("days")}</option>
                  <option value="30days">30 {t("days")}</option>
                </select>
                <button
                  onClick={() => navigate("/calendar")}
                  className="text-xs text-primary hover:underline"
                >
                  {t("viewCalendar")}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {todayEventsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : todayEvents.length === 0 ? (
              <p className="text-sm text-muted text-center py-4">{t("noEvents")}</p>
            ) : (
            <div className="space-y-2">
              {todayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface-alt p-3"
                >
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-stone-800 dark:text-text">{ev.title}</p>
                    {ev.note && (
                      <p className="text-xs text-muted mt-0.5">{ev.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-800">
              {t("revenue")}
              {dateFrom || dateTo ? ` (${t("filteredPeriod")})` : ` (${topN} ${t("lastDays")})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <p className="text-sm text-muted text-center py-8">
                {t("noData")}
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#a8a29e" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#a8a29e" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `${(value as number).toLocaleString()} DA`,
                        t("revenue"),
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e7e5e4",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenu"
                      stroke="#ea580c"
                      strokeWidth={2}
                      dot={{ r: 3, fill: "#ea580c" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-800">
              {t("topClients")} ({topN})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <p className="text-sm text-muted text-center py-8">
                {t("noData")}
              </p>
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#a8a29e" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#44403c" }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `${(value as number).toLocaleString()} DA`,
                        t("total"),
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid #e7e5e4",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#f59e0b"
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="text-sm font-semibold text-stone-800">
              {t("topProducts")} ({topN})
            </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-muted text-center py-8">{t("noData")}</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#a8a29e" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#44403c" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip
                    formatter={(value: unknown) => [`${value} ${t("sold")}`, t("quantity")]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e7e5e4", fontSize: 12 }}
                  />
                  <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={20}>
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-stone-800">
            {t("recentOrders")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-muted py-4 text-center">
              {t("noOrdersPeriod")}
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface-alt p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-800">
                        {order.clientName}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(order.date).toLocaleDateString(locale, {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {order.total.toLocaleString()} DA
                    </span>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
