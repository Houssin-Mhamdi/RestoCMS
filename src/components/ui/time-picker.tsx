import { useState, useRef, useEffect } from "react"
import { Button } from "./button"
import { ScrollArea } from "./scroll-area"
import { Clock } from "lucide-react"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
}

const TIMES: string[] = []
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIMES.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        onClick={() => setOpen(!open)}
        className="w-full justify-between font-normal"
      >
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          {value || "00:00"}
        </span>
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
          <ScrollArea className="h-56">
            <div className="p-1">
              {TIMES.map((t) => (
                <button
                  key={t}
                  onClick={() => { onChange(t); setOpen(false) }}
                  className={`w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors ${
                    t === value
                      ? "bg-primary text-primary-foreground"
                      : "text-text hover:bg-surface-alt"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
