/**
 * Generates a consistent gradient background based on a string ID.
 */
export function getRandomGradient(id: string, variant: 'subtle' | 'vibrant' = 'vibrant'): string {
  const gradients = {
    subtle: [
      "from-blue-500/20 to-indigo-500/20",
      "from-emerald-500/20 to-teal-500/20",
      "from-orange-500/20 to-amber-500/20",
      "from-rose-500/20 to-pink-500/20",
      "from-violet-500/20 to-purple-500/20",
      "from-cyan-500/20 to-sky-500/20",
      "from-lime-500/20 to-green-500/20",
      "from-fuchsia-500/20 to-pink-500/20",
    ],
    vibrant: [
      "from-blue-500/50 to-indigo-500/50",
      "from-emerald-500/50 to-teal-500/50",
      "from-orange-500/50 to-amber-500/50",
      "from-rose-500/50 to-pink-500/50",
      "from-violet-500/50 to-purple-500/50",
      "from-cyan-500/50 to-sky-500/50",
      "from-lime-500/50 to-green-500/50",
      "from-fuchsia-500/50 to-pink-500/50",
    ]
  }

  const list = gradients[variant]
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % list.length
  return list[index]
}
