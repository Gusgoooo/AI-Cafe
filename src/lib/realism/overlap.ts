export function checkForOverlap(
  impulses: Map<string, number>
): { concurrent: string[] } | null {
  const sorted = [...impulses.entries()].sort((a, b) => b[1] - a[1])

  if (sorted.length < 2) return null

  if (sorted[0][1] > 60 && sorted[1][1] > 55 && sorted[0][1] - sorted[1][1] < 15) {
    return { concurrent: [sorted[0][0], sorted[1][0]] }
  }

  return null
}
