function charScore(a: string, b: string): number {
  a = a.toLowerCase()
  b = b.toLowerCase()
  let score = 0
  let bi = 0
  for (let ai = 0; ai < a.length && bi < b.length; ai++) {
    if (a[ai] === b[bi]) {
      score++
      bi++
    }
  }
  return score
}

export function fuzzyMatch(query: string, target: string): number {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  if (t.includes(q)) return 1 + q.length / t.length
  const score = charScore(q, t)
  return score / Math.max(q.length, t.length) * 0.7
}

export function fuzzySort<T>(
  items: T[],
  query: string,
  extract: (item: T) => string
): T[] {
  if (!query.trim()) return items
  const scored = items
    .map((item) => ({ item, score: fuzzyMatch(query, extract(item)) }))
    .filter((s) => s.score > 0.3)
    .sort((a, b) => b.score - a.score)
  return scored.map((s) => s.item)
}
