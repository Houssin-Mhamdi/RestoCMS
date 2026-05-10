import { useEffect } from "react"

type Handler = (e: KeyboardEvent) => void

const shortcuts = new Map<string, Handler>()

export function useKeyboardShortcut(
  key: string,
  handler: Handler,
  ctrlKey = true
) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (ctrlKey && !e.ctrlKey && !e.metaKey) return
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        handler(e)
      }
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [key, handler, ctrlKey])
}
