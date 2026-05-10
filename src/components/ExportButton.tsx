import { useState } from "react"
import { useI18n, LOCALE_MAP } from "../lib/i18n"
import { useSettings } from "../lib/settings"
import { Button } from "./ui/button"
import { Download, FileText, FileSpreadsheet } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ExportButtonProps {
  data: { clientName: string; date: string; total: number; items: string }[]
  filename?: string
}

export default function ExportButton({
  data,
  filename = "rapport",
}: ExportButtonProps) {
  const { t, lang } = useI18n()
  const { activeRestaurant } = useSettings()
  const [open, setOpen] = useState(false)

  const exportPdf = () => {
    const doc = new jsPDF()
    doc.text("Rapport des commandes", 14, 15)
    autoTable(doc, {
      head: [["Client", "Date", "Articles", "Total"]],
      body: data.map((r) => [
        r.clientName,
        new Date(r.date).toLocaleDateString(LOCALE_MAP[lang]),
        r.items,
        `${r.total.toLocaleString()} ${activeRestaurant.currency}`,
      ]),
      startY: 25,
    })
    doc.save(`${filename}.pdf`)
    setOpen(false)
  }

  const exportCsv = () => {
    const header = "Client;Date;Articles;Total\n"
    const rows = data
      .map(
        (r) =>
          `${r.clientName};${new Date(r.date).toLocaleDateString(LOCALE_MAP[lang])};"${r.items}";${r.total}`
      )
      .join("\n")
    const bom = "\uFEFF"
    const blob = new Blob([bom + header + rows], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Download className="h-4 w-4" />
        {t("export")}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-card shadow-lg py-1">
            <button
              onClick={exportPdf}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-surface-alt"
            >
              <FileText className="h-4 w-4 text-danger" />
              {t("exportPdf")}
            </button>
            <button
              onClick={exportCsv}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-surface-alt"
            >
              <FileSpreadsheet className="h-4 w-4 text-success" />
              {t("exportCsv")}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
